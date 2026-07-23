import express from 'express';
import { query } from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, authorize('admin')); // owner dashboard — admin only

router.get('/stats', async (req, res, next) => {
  try {
    const [revTotal, revMonthly, outstanding, running, fleet, growthMonthly, clientsTotal] =
      await Promise.all([
        query(`SELECT COALESCE(SUM(paid_amount),0)::float AS total FROM invoices`),
        query(`
          SELECT to_char(m.month, 'YYYY-MM') AS month,
                 COALESCE(SUM(i.paid_amount),0)::float AS amount
          FROM generate_series(date_trunc('month', now()) - interval '5 months',
                               date_trunc('month', now()), interval '1 month') AS m(month)
          LEFT JOIN invoices i ON date_trunc('month', i.created_at) = m.month
          GROUP BY m.month ORDER BY m.month`),
        query(`SELECT COALESCE(SUM(total_amount - paid_amount),0)::float AS total
               FROM invoices WHERE status IN ('sent','partial','overdue')`),
        query(`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'running'`),
        query(`
          SELECT crane_type,
                 COUNT(*) FILTER (WHERE status = 'running')::int AS running,
                 COUNT(*)::int AS total
          FROM orders
          WHERE status IN ('approved','running','completed')
          GROUP BY crane_type ORDER BY crane_type`),
        query(`
          SELECT to_char(m.month, 'YYYY-MM') AS month,
                 COUNT(c.id)::int AS count
          FROM generate_series(date_trunc('month', now()) - interval '5 months',
                               date_trunc('month', now()), interval '1 month') AS m(month)
          LEFT JOIN clients c ON date_trunc('month', c.created_at) = m.month
          GROUP BY m.month ORDER BY m.month`),
        query(`SELECT COUNT(*)::int AS count FROM clients`),
      ]);

    const byCraneType = fleet.rows.map((r) => ({
      ...r,
      pct: r.total ? +((r.running / r.total) * 100).toFixed(1) : 0,
    }));
    const fleetRunning = byCraneType.reduce((s, r) => s + r.running, 0);
    const fleetTotal = byCraneType.reduce((s, r) => s + r.total, 0);

    res.json({
      revenue: { total: revTotal.rows[0].total, monthly: revMonthly.rows },
      outstanding: outstanding.rows[0].total,
      runningProjects: running.rows[0].count,
      fleetUtilization: {
        overallPct: fleetTotal ? +((fleetRunning / fleetTotal) * 100).toFixed(1) : 0,
        byCraneType,
      },
      customerGrowth: { total: clientsTotal.rows[0].count, monthly: growthMonthly.rows },
    });
  } catch (err) { next(err); }
});

export default router;
