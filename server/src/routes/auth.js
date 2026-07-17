import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool, { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { logActivity } from '../lib/activity.js';

const router = express.Router();

const registerSchema = z.object({
  company_name:    z.string().min(2),
  registration_no: z.string().min(2),
  pic_name:        z.string().min(2),
  phone:           z.string().min(6),
  email:           z.string().email(),
  address:         z.string().min(5),
  industry:        z.string().optional(),
  password:        z.string().min(8),
});

router.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }
  const d = parsed.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dupe = await client.query('SELECT 1 FROM users WHERE email = $1', [d.email]);
    if (dupe.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(d.password, 10);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, 'customer', 'pending') RETURNING id, email, role, status`,
      [d.email, hash]
    );

    const { rows: [company] } = await client.query(
      `INSERT INTO clients (user_id, company_name, registration_no, pic_name, phone, email, address, industry)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [user.id, d.company_name, d.registration_no, d.pic_name, d.phone, d.email, d.address, d.industry ?? null]
    );

    await client.query('COMMIT');
    await logActivity(user.id, 'register', 'client', company.id, { company: d.company_name });

    res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.', user });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email or registration number already exists' });
    next(err);
  } finally {
    client.release();   // leak this and you exhaust the pool in ~10 requests
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows: [user] } = await query(
      `SELECT u.*, c.id AS client_id, c.company_name
       FROM users u LEFT JOIN clients c ON c.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    // same message + same timing whether the user exists or not
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: `Account is ${user.status}. Contact your administrator.` });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, client_id: user.client_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await logActivity(user.id, 'login', 'user', user.id);

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, client_id: user.client_id, company_name: user.company_name },
    });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows: [user] } = await query(
      `SELECT u.id, u.email, u.role, u.status, c.id AS client_id, c.company_name
       FROM users u LEFT JOIN clients c ON c.user_id = u.id WHERE u.id = $1`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

export default router;
