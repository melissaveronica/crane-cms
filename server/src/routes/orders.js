import express from 'express';
import { z } from 'zod';
import pool, { query } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from '../lib/activity.js';
import { buildList, addFilter, whereClause, meta } from '../lib/listQuery.js';
import { nextOrderNo } from '../lib/orderNo.js';
import { uploadDrawings } from '../middleware/upload.js';
import { TRANSITIONS, canTransition } from '../lib/orderStatus.js';

const router = express.Router();
router.use(authenticate);

const SORTABLE   = ['order_no', 'project_name', 'status', 'start_date', 'created_at', 'id'];
const SEARCHABLE = ['o.order_no', 'o.project_name', 'o.location', 'c.company_name'];

router.get('/', async (req, res, next) => {
  try {
    const state = buildList(req.query, {
      sortable: SORTABLE, searchable: SEARCHABLE, defaultSort: 'created_at',
    });

    addFilter(state, 'o.status = $?', req.query.status);
    addFilter(state, 'o.client_id = $?', req.query.client_id);

    // customers see only their own orders — enforced in SQL
    if (req.user.role === 'customer') addFilter(state, 'o.client_id = $?', req.user.client_id);

    const w = whereClause(state.where);

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*)::int AS count FROM orders o LEFT JOIN clients c ON c.id = o.client_id ${w}`,
      state.values
    );

    const { rows } = await query(
      `SELECT o.*, c.company_name,
              (SELECT COUNT(*)::int FROM order_attachments a WHERE a.order_id = o.id) AS attachment_count
       FROM orders o LEFT JOIN clients c ON c.id = o.client_id
       ${w} ORDER BY ${state.orderBy}
       LIMIT $${state.values.length + 1} OFFSET $${state.values.length + 2}`,
      [...state.values, state.limit, state.offset]
    );

    res.json({ data: rows, meta: meta(state.page, state.limit, count) });
  } catch (err) { next(err); }
});

const orderSchema = z.object({
  client_id:       z.coerce.number().int().positive().optional(),
  project_name:    z.string().min(2),
  location:        z.string().min(2),
  start_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  crane_type:      z.string().min(2),
  capacity_tonnes: z.coerce.number().positive(),
  load_weight_kg:  z.coerce.number().positive(),
  lift_height_m:   z.coerce.number().positive(),
  site_condition:  z.string().optional(),
}).refine((d) => d.end_date >= d.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

router.post('/', authorize('admin', 'sales', 'customer'), (req, res, next) => {
  uploadDrawings(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    }
    const d = parsed.data;

    // customers can only order for their own company
    const clientId = req.user.role === 'customer' ? req.user.client_id : d.client_id;
    if (!clientId) return res.status(400).json({ error: 'Client is required' });

    const conn = await pool.connect();
    try {
      await conn.query('BEGIN');
      const orderNo = await nextOrderNo(conn);

      const { rows: [order] } = await conn.query(
        `INSERT INTO orders (order_no, client_id, project_name, location, start_date, end_date,
                             crane_type, capacity_tonnes, load_weight_kg, lift_height_m,
                             site_condition, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [orderNo, clientId, d.project_name, d.location, d.start_date, d.end_date, d.crane_type,
         d.capacity_tonnes, d.load_weight_kg, d.lift_height_m, d.site_condition ?? null, req.user.id]
      );

      for (const f of req.files || []) {
        await conn.query(
          `INSERT INTO order_attachments (order_id, file_path, original_name, mime_type, size_bytes)
           VALUES ($1,$2,$3,$4,$5)`,
          [order.id, `/uploads/orders/${f.filename}`, f.originalname, f.mimetype, f.size]
        );
      }

      await conn.query('COMMIT');
      await logActivity(req.user.id, 'create', 'order', order.id, { order_no: orderNo });
      res.status(201).json(order);
    } catch (err) {
      await conn.query('ROLLBACK');
      next(err);
    } finally {
      conn.release();
    }
  });
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows: [order] } = await query(
      `SELECT o.*, c.company_name FROM orders o
       LEFT JOIN clients c ON c.id = o.client_id WHERE o.id = $1`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role === 'customer' && order.client_id !== req.user.client_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows: attachments } = await query(
      `SELECT id, file_path, original_name, mime_type, size_bytes, uploaded_at
       FROM order_attachments WHERE order_id = $1 ORDER BY uploaded_at`,
      [order.id]
    );

    res.json({ ...order, attachments, allowed_transitions: TRANSITIONS[order.status] || [] });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authorize('admin', 'sales', 'operation'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const { rows: [order] } = await query('SELECT id, status FROM orders WHERE id = $1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (!canTransition(order.status, status)) {
      return res.status(409).json({
        error: `Cannot move from ${order.status} to ${status}`,
        allowed: TRANSITIONS[order.status],
      });
    }

    const { rows: [updated] } = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    await logActivity(req.user.id, 'status_change', 'order', updated.id,
      { from: order.status, to: status });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Order not found' });
    await logActivity(req.user.id, 'delete', 'order', Number(req.params.id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
