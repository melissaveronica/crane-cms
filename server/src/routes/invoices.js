import express from 'express';
import { z } from 'zod';
import pool, { query } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from '../lib/activity.js';
import { buildList, addFilter, whereClause, meta } from '../lib/listQuery.js';
import { nextInvoiceNo } from '../lib/invoiceNo.js';
import { renderInvoicePdf, invoicePdfBuffer } from '../lib/pdf.js';
import { sendInvoiceEmail } from '../lib/mailer.js';

const router = express.Router();
router.use(authenticate);

const SORTABLE   = ['invoice_no', 'total_amount', 'status', 'due_date', 'created_at', 'id'];
const SEARCHABLE = ['i.invoice_no', 'c.company_name'];

// same idea as the order status machine (Step 15) — the server owns the
// rule, the UI just renders whichever buttons are legal right now
export const INVOICE_TRANSITIONS = {
  draft:   ['sent'],
  sent:    ['paid', 'partial', 'overdue'],
  partial: ['paid', 'overdue'],
  overdue: ['paid', 'partial'],
  paid:    [],
};
const canTransition = (from, to) => (INVOICE_TRANSITIONS[from] || []).includes(to);

router.get('/', async (req, res, next) => {
  try {
    const state = buildList(req.query, {
      sortable: SORTABLE, searchable: SEARCHABLE, defaultSort: 'created_at',
    });

    addFilter(state, 'i.status = $?', req.query.status);
    addFilter(state, 'i.client_id = $?', req.query.client_id);
    if (req.user.role === 'customer') addFilter(state, 'i.client_id = $?', req.user.client_id);

    const w = whereClause(state.where);

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*)::int AS count FROM invoices i LEFT JOIN clients c ON c.id = i.client_id ${w}`,
      state.values
    );

    const { rows } = await query(
      `SELECT i.*, c.company_name, o.order_no
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN orders o ON o.id = i.order_id
       ${w} ORDER BY ${state.orderBy}
       LIMIT $${state.values.length + 1} OFFSET $${state.values.length + 2}`,
      [...state.values, state.limit, state.offset]
    );

    res.json({ data: rows, meta: meta(state.page, state.limit, count) });
  } catch (err) { next(err); }
});

const invoiceSchema = z.object({
  order_id:           z.coerce.number().int().positive(),
  base_amount:        z.coerce.number().nonnegative(),
  ot_hours:           z.coerce.number().nonnegative().optional().default(0),
  ot_rate:            z.coerce.number().nonnegative().optional().default(0),
  weekend_days:       z.coerce.number().nonnegative().optional().default(0),
  weekend_rate:       z.coerce.number().nonnegative().optional().default(0),
  additional_charges: z.coerce.number().nonnegative().optional().default(0),
  discount:           z.coerce.number().nonnegative().optional().default(0),
  tax_percent:        z.coerce.number().nonnegative().optional().default(0),
  due_date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes:              z.string().optional(),
});

router.post('/', authorize('admin', 'sales', 'finance'), async (req, res, next) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');

    const { rows: [order] } = await conn.query('SELECT id, client_id FROM orders WHERE id = $1', [d.order_id]);
    if (!order) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // math lives here, not in React — the PDF and the API must agree on one total
    const otAmount = d.ot_hours * d.ot_rate;
    const weekendAmount = d.weekend_days * d.weekend_rate;
    const subtotal = d.base_amount + otAmount + weekendAmount + d.additional_charges - d.discount;
    const taxAmount = subtotal * (d.tax_percent / 100);
    const totalAmount = subtotal + taxAmount;

    const invoiceNo = await nextInvoiceNo(conn);

    const { rows: [invoice] } = await conn.query(
      `INSERT INTO invoices (invoice_no, order_id, client_id, base_amount, ot_hours, ot_rate,
                             weekend_days, weekend_rate, additional_charges, discount, tax_percent,
                             subtotal, tax_amount, total_amount, due_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [invoiceNo, order.id, order.client_id, d.base_amount, d.ot_hours, d.ot_rate,
       d.weekend_days, d.weekend_rate, d.additional_charges, d.discount, d.tax_percent,
       subtotal, taxAmount, totalAmount, d.due_date, d.notes ?? null, req.user.id]
    );

    await conn.query('COMMIT');
    await logActivity(req.user.id, 'create', 'invoice', invoice.id, { invoice_no: invoiceNo });
    res.status(201).json(invoice);
  } catch (err) {
    await conn.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Invoice number collision — retry' });
    next(err);
  } finally {
    conn.release();
  }
});

async function loadInvoiceFull(id) {
  const { rows: [invoice] } = await query('SELECT * FROM invoices WHERE id = $1', [id]);
  if (!invoice) return null;
  const { rows: [client] } = await query('SELECT * FROM clients WHERE id = $1', [invoice.client_id]);
  const { rows: [order] } = await query('SELECT * FROM orders WHERE id = $1', [invoice.order_id]);
  return { invoice, client, order };
}

router.get('/:id', async (req, res, next) => {
  try {
    const full = await loadInvoiceFull(req.params.id);
    if (!full) return res.status(404).json({ error: 'Invoice not found' });
    if (req.user.role === 'customer' && full.invoice.client_id !== req.user.client_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json({ ...full.invoice, client: full.client, order: full.order,
      allowed_transitions: INVOICE_TRANSITIONS[full.invoice.status] || [] });
  } catch (err) { next(err); }
});

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const full = await loadInvoiceFull(req.params.id);
    if (!full) return res.status(404).json({ error: 'Invoice not found' });
    if (req.user.role === 'customer' && full.invoice.client_id !== req.user.client_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    renderInvoicePdf(res, full);
  } catch (err) { next(err); }
});

const statusSchema = z.object({
  status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue']),
  paid_amount: z.coerce.number().nonnegative().optional(),
});

router.patch('/:id/status', authorize('admin', 'sales', 'finance'), async (req, res, next) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }
  try {
    const { rows: [invoice] } = await query('SELECT id, status, paid_amount FROM invoices WHERE id = $1', [req.params.id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (!canTransition(invoice.status, parsed.data.status)) {
      return res.status(409).json({
        error: `Cannot move from ${invoice.status} to ${parsed.data.status}`,
        allowed: INVOICE_TRANSITIONS[invoice.status],
      });
    }

    const paidAmount = parsed.data.paid_amount ?? invoice.paid_amount;
    const { rows: [updated] } = await query(
      'UPDATE invoices SET status = $1, paid_amount = $2 WHERE id = $3 RETURNING *',
      [parsed.data.status, paidAmount, req.params.id]
    );
    await logActivity(req.user.id, 'status_change', 'invoice', updated.id,
      { from: invoice.status, to: parsed.data.status });
    res.json(updated);
  } catch (err) { next(err); }
});

router.post('/:id/send-email', authorize('admin', 'sales', 'finance'), async (req, res, next) => {
  try {
    const full = await loadInvoiceFull(req.params.id);
    if (!full) return res.status(404).json({ error: 'Invoice not found' });

    const pdfBuffer = await invoicePdfBuffer(full);
    const result = await sendInvoiceEmail({
      to: full.client.email,
      subject: `Invoice ${full.invoice.invoice_no} from Crane CMS`,
      text: `Dear ${full.client.pic_name},\n\nPlease find attached invoice ${full.invoice.invoice_no} ` +
            `for order ${full.order.order_no}, total Rp ${full.invoice.total_amount}, due ${full.invoice.due_date}.\n\nThank you.`,
      pdfBuffer,
      filename: `${full.invoice.invoice_no}.pdf`,
    });

    if (full.invoice.status === 'draft') {
      await query('UPDATE invoices SET status = $1 WHERE id = $2', ['sent', full.invoice.id]);
    }
    await logActivity(req.user.id, 'email', 'invoice', full.invoice.id, result);
    res.json(result);
  } catch (err) { next(err); }
});

// WhatsApp Business API needs a paid account + approved template — for a
// beginner project, a wa.me deep link (opens WhatsApp Web/app with the
// message pre-filled) is the standard no-credentials alternative.
router.get('/:id/whatsapp-link', async (req, res, next) => {
  try {
    const full = await loadInvoiceFull(req.params.id);
    if (!full) return res.status(404).json({ error: 'Invoice not found' });

    const phoneDigits = full.client.phone.replace(/\D/g, '');
    const message =
      `Hi ${full.client.pic_name}, invoice ${full.invoice.invoice_no} ` +
      `(Rp ${full.invoice.total_amount}) for order ${full.order.order_no} is due ${full.invoice.due_date}. ` +
      `View it here: ${req.protocol}://${req.get('host')}/api/invoices/${full.invoice.id}/pdf`;

    res.json({ url: `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}` });
  } catch (err) { next(err); }
});

export default router;
