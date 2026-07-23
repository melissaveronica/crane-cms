import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { logActivity } from '../lib/activity.js';

const router = express.Router();
router.use(authenticate, authorize('customer')); // portal endpoints — customer only

router.get('/profile', async (req, res, next) => {
  try {
    const { rows: [profile] } = await query(
      `SELECT c.*, u.email AS account_email
       FROM clients c JOIN users u ON u.id = c.user_id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) { next(err); }
});

// only these three fields are customer-editable; .strict() rejects the rest
const profileSchema = z.object({
  pic_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  address: z.string().trim().min(1).max(400),
}).partial().strict();

router.patch('/profile', async (req, res, next) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const details = { ...flat.fieldErrors };
    if (flat.formErrors.length) details._root = flat.formErrors;
    return res.status(400).json({ error: 'Validation failed', details });
  }
  try {
    const entries = Object.entries(parsed.data);
    if (!entries.length) return res.status(400).json({ error: 'No fields to update' });

    // keys come from the zod schema, not req.body — safe to interpolate
    const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
    const values = entries.map(([, v]) => v);

    const { rows: [row] } = await query(
      `UPDATE clients SET ${sets} WHERE user_id = $${values.length + 1} RETURNING *`,
      [...values, req.user.id]
    );
    if (!row) return res.status(404).json({ error: 'Profile not found' });

    await logActivity(req.user.id, 'update', 'client', row.id, { fields: entries.map(([k]) => k), via: 'portal' });
    res.json(row);
  } catch (err) { next(err); }
});

router.get('/documents', async (req, res, next) => {
  try {
    const [attachments, invoices] = await Promise.all([
      query(
        `SELECT a.id, a.order_id, o.order_no, o.project_name,
                a.original_name, a.file_path, a.mime_type, a.size_bytes, a.uploaded_at
         FROM order_attachments a
         JOIN orders o ON o.id = a.order_id
         WHERE o.client_id = $1
         ORDER BY a.uploaded_at DESC`,
        [req.user.client_id]
      ),
      query(
        `SELECT id, invoice_no, status, total_amount, created_at
         FROM invoices WHERE client_id = $1 ORDER BY created_at DESC`,
        [req.user.client_id]
      ),
    ]);
    res.json({ attachments: attachments.rows, invoices: invoices.rows, client_id: req.user.client_id });
  } catch (err) { next(err); }
});

export default router;
