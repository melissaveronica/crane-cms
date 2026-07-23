import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

import clientRoutes from './routes/clients.js';
app.use('/api/clients', clientRoutes);

import orderRoutes from './routes/orders.js';
app.use('/api/orders', orderRoutes);

import invoiceRoutes from './routes/invoices.js';
app.use('/api/invoices', invoiceRoutes);

import dashboardRoutes from './routes/dashboard.js';
app.use('/api/dashboard', dashboardRoutes);

// routes mount here as you build them

// error handler — MUST be last, and MUST have 4 args or Express ignores it
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
