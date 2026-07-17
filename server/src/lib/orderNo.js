import { query } from '../db.js';

// CR-202607-0001 — sequential within the month
export async function nextOrderNo(client) {
  const prefix = `CR-${new Date().toISOString().slice(0, 7).replace('-', '')}`;
  const q = client ? client.query.bind(client) : query;
  const { rows: [row] } = await q(
    `SELECT order_no FROM orders WHERE order_no LIKE $1 ORDER BY order_no DESC LIMIT 1`,
    [`${prefix}-%`]
  );
  const next = row ? parseInt(row.order_no.split('-')[2], 10) + 1 : 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}
