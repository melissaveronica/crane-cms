import nodemailer from 'nodemailer';

// Beginner-friendly on purpose: if SMTP isn't configured, we don't crash
// or fail the request — we just log what *would* have been sent. Fill in
// SMTP_HOST/PORT/USER/PASS in .env to actually send mail.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendInvoiceEmail({ to, subject, text, pdfBuffer, filename }) {
  const t = getTransporter();

  if (!t) {
    console.log(`[mailer] SMTP not configured — dry run only.`);
    console.log(`[mailer] To: ${to}\n[mailer] Subject: ${subject}\n[mailer] Body: ${text}`);
    return { sent: false, dryRun: true };
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    attachments: pdfBuffer ? [{ filename, content: pdfBuffer }] : [],
  });
  return { sent: true, dryRun: false };
}
