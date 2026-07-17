import PDFDocument from 'pdfkit';

const money = (n) => `Rp ${Number(n).toFixed(2)}`;

function drawInvoice(doc, { invoice, client, order }) {
  doc.fontSize(20).text('INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#666').text(invoice.invoice_no, { align: 'right' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(12).text('Bill To:');
  doc.fontSize(10).text(client.company_name);
  doc.text(client.address);
  doc.text(client.email);
  doc.moveDown();

  doc.fontSize(10).text(`Order: ${order.order_no} — ${order.project_name}`);
  doc.text(`Due date: ${invoice.due_date}`);
  doc.text(`Status: ${invoice.status.toUpperCase()}`);
  doc.moveDown(1.5);

  const row = (label, value) => {
    doc.fontSize(10).text(label, 50, doc.y, { continued: true, width: 300 });
    doc.text(value, { align: 'right' });
  };

  row('Base amount', money(invoice.base_amount));
  if (Number(invoice.ot_hours) > 0) {
    row(`Overtime (${invoice.ot_hours}h @ ${money(invoice.ot_rate)}/h)`, money(invoice.ot_hours * invoice.ot_rate));
  }
  if (Number(invoice.weekend_days) > 0) {
    row(`Weekend rate (${invoice.weekend_days}d @ ${money(invoice.weekend_rate)}/d)`, money(invoice.weekend_days * invoice.weekend_rate));
  }
  if (Number(invoice.additional_charges) > 0) row('Additional charges', money(invoice.additional_charges));
  if (Number(invoice.discount) > 0) row('Discount', `- ${money(invoice.discount)}`);

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.5);

  row('Subtotal', money(invoice.subtotal));
  row(`Tax (${invoice.tax_percent}%)`, money(invoice.tax_amount));
  doc.fontSize(12);
  row('Total', money(invoice.total_amount));
  row('Paid', money(invoice.paid_amount));
  doc.fontSize(12).fillColor('#c00');
  row('Balance due', money(invoice.total_amount - invoice.paid_amount));

  if (invoice.notes) {
    doc.moveDown(1.5).fillColor('#000').fontSize(10).text(`Notes: ${invoice.notes}`);
  }
}

function drawStatement(doc, { client, invoices, outstandingBalance }) {
  doc.fontSize(20).text('STATEMENT OF ACCOUNT', { align: 'right' });
  doc.fontSize(10).fillColor('#666').text(new Date().toISOString().slice(0, 10), { align: 'right' });
  doc.moveDown(2);

  doc.fillColor('#000').fontSize(12).text(client.company_name);
  doc.fontSize(10).text(client.address);
  doc.text(client.email);
  doc.moveDown(1.5);

  const colX = [50, 160, 260, 340, 420, 490];
  const header = ['Invoice', 'Date', 'Due', 'Total', 'Paid', 'Balance'];
  header.forEach((h, i) => doc.text(h, colX[i], doc.y, { continued: i < header.length - 1 }));
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.3);

  for (const inv of invoices) {
    const y = doc.y;
    const balance = inv.total_amount - inv.paid_amount;
    doc.text(inv.invoice_no, colX[0], y, { width: 100 });
    doc.text(String(inv.created_at).slice(0, 10), colX[1], y, { width: 90 });
    doc.text(String(inv.due_date).slice(0, 10), colX[2], y, { width: 70 });
    doc.text(money(inv.total_amount), colX[3], y, { width: 70 });
    doc.text(money(inv.paid_amount), colX[4], y, { width: 70 });
    doc.text(money(balance), colX[5], y, { width: 70 });
    doc.moveDown(0.6);
  }

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ccc').stroke();
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor('#c00').text(`Outstanding balance: ${money(outstandingBalance)}`, { align: 'right' });
}

// Collects the streamed PDF chunks into a Buffer — used when we need the
// bytes in hand (e.g. as an email attachment) rather than sent straight
// to an HTTP response.
function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export function renderInvoicePdf(res, data) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${data.invoice.invoice_no}.pdf"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  drawInvoice(doc, data);
  doc.end();
}

export function renderStatementPdf(res, data) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="statement-${data.client.id}.pdf"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  drawStatement(doc, data);
  doc.end();
}

export function invoicePdfBuffer(data) {
  const doc = new PDFDocument({ margin: 50 });
  drawInvoice(doc, data);
  return toBuffer(doc);
}
