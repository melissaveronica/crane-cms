import { query } from '../db.js';

// INV-202607-0001 — sequential within the month
export async function nextInvoiceNo(client) {
  const prefix = `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}`;
  const q = client ? client.query.bind(client) : query;
  const { rows: [row] } = await q(
    `SELECT invoice_no FROM invoices WHERE invoice_no LIKE $1 ORDER BY invoice_no DESC LIMIT 1`,
    [`${prefix}-%`]
  );
  const next = row ? parseInt(row.invoice_no.split('-')[2], 10) + 1 : 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}
