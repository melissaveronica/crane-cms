import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from '../lib/activity.js';
import { buildList, addFilter, whereClause, meta } from '../lib/listQuery.js';
import { renderStatementPdf } from '../lib/pdf.js';

const router = express.Router();
router.use(authenticate);   // every route below requires a valid token

const SORTABLE   = ['company_name', 'industry', 'created_at', 'id'];
const SEARCHABLE = ['c.company_name', 'c.pic_name', 'c.email', 'c.registration_no'];

router.get('/', async (req, res, next) => {
  try {
    const state = buildList(req.query, {
      sortable: SORTABLE, searchable: SEARCHABLE, defaultSort: 'created_at',
    });

    addFilter(state, 'c.industry = $?', req.query.industry);
    addFilter(state, 'u.status = $?', req.query.status);

    // customers see only their own row — enforced in SQL, not in React
    if (req.user.role === 'customer') addFilter(state, 'c.user_id = $?', req.user.id);

    const w = whereClause(state.where);

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*)::int AS count FROM clients c LEFT JOIN users u ON u.id = c.user_id ${w}`,
      state.values
    );

    const { rows } = await query(
      `SELECT c.*, u.status AS account_status, u.email AS login_email,
              (SELECT COUNT(*)::int FROM orders o WHERE o.client_id = c.id) AS order_count
       FROM clients c LEFT JOIN users u ON u.id = c.user_id
       ${w} ORDER BY ${state.orderBy}
       LIMIT $${state.values.length + 1} OFFSET $${state.values.length + 2}`,
      [...state.values, state.limit, state.offset]
    );

    res.json({ data: rows, meta: meta(state.page, state.limit, count) });
  } catch (err) { next(err); }
});

const clientSchema = z.object({
  company_name:    z.string().min(2),
  registration_no: z.string().min(2),
  pic_name:        z.string().min(2),
  phone:           z.string().min(6),
  email:           z.string().email(),
  address:         z.string().min(5),
  industry:        z.string().optional(),
  payment_terms:   z.string().optional(),
});

router.post('/', authorize('admin', 'sales'), async (req, res, next) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const d = parsed.data;
    const { rows: [row] } = await query(
      `INSERT INTO clients (company_name, registration_no, pic_name, phone, email, address, industry, payment_terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [d.company_name, d.registration_no, d.pic_name, d.phone, d.email, d.address,
       d.industry ?? null, d.payment_terms ?? 'NET30']
    );
    await logActivity(req.user.id, 'create', 'client', row.id, { company: row.company_name });
    res.status(201).json(row);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Registration number already exists' });
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows: [row] } = await query(
      `SELECT c.*, u.status AS account_status FROM clients c
       LEFT JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Client not found' });
    if (req.user.role === 'customer' && row.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(row);
  } catch (err) { next(err); }
});

router.patch('/:id', authorize('admin', 'sales'), async (req, res, next) => {
  const parsed = clientSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const entries = Object.entries(parsed.data);
    if (!entries.length) return res.status(400).json({ error: 'No fields to update' });

    // keys come from the zod schema, not from req.body — safe to interpolate
    const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
    const values = entries.map(([, v]) => v);

    const { rows: [row] } = await query(
      `UPDATE clients SET ${sets} WHERE id = $${values.length + 1} RETURNING *`,
      [...values, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Client not found' });

    await logActivity(req.user.id, 'update', 'client', row.id, { fields: entries.map(([k]) => k) });
    res.json(row);
  } catch (err) { next(err); }
});

router.patch('/:id/status', authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    const { rows: [row] } = await query(
      `UPDATE users SET status = $1
       WHERE id = (SELECT user_id FROM clients WHERE id = $2) RETURNING id, email, status`,
      [status, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Client has no linked account' });

    await logActivity(req.user.id, `account_${status}`, 'client', Number(req.params.id));
    res.json(row);
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM clients WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Client not found' });
    await logActivity(req.user.id, 'delete', 'client', Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

// Module 5 — Statement of Account: aggregated from invoices, not stored
// as its own table. Outstanding balance = total - paid on every invoice
// that isn't fully paid.
async function loadStatement(clientId) {
  const { rows: [client] } = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
  if (!client) return null;

  const { rows: invoices } = await query(
    `SELECT * FROM invoices WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId]
  );

  const outstandingBalance = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount) - Number(inv.paid_amount), 0);

  return { client, invoices, outstandingBalance };
}

router.get('/:id/statement', async (req, res, next) => {
  try {
    const statement = await loadStatement(req.params.id);
    if (!statement) return res.status(404).json({ error: 'Client not found' });
    if (req.user.role === 'customer' && statement.client.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(statement);
  } catch (err) { next(err); }
});

router.get('/:id/statement/pdf', async (req, res, next) => {
  try {
    const statement = await loadStatement(req.params.id);
    if (!statement) return res.status(404).json({ error: 'Client not found' });
    if (req.user.role === 'customer' && statement.client.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    renderStatementPdf(res, statement);
  } catch (err) { next(err); }
});

export default router;
