import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const ALL_STATUSES = ['draft', 'sent', 'paid', 'partial', 'overdue'];

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = ['admin', 'sales', 'finance'].includes(user?.role);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/invoices/${id}`)
      .then((res) => { setInvoice(res.data); setPaidAmount(res.data.paid_amount); })
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/invoices/${id}/status`, { status, paid_amount: paidAmount });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Status change failed');
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async () => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const { data } = await api.post(`/invoices/${id}/send-email`);
      setNotice(data.dryRun ? 'SMTP not configured — email logged to server console instead of sent.' : 'Email sent.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email');
    } finally {
      setBusy(false);
    }
  };

  const shareWhatsapp = async () => {
    const { data } = await api.get(`/invoices/${id}/whatsapp-link`);
    window.open(data.url, '_blank');
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error && !invoice) return <div className="p-6 text-error-300">{error}</div>;
  if (!invoice) return null;

  const balance = invoice.total_amount - invoice.paid_amount;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white">{invoice.invoice_no}</h1>
          <p className="text-bgray-600">{invoice.client?.company_name} — Order {invoice.order?.order_no}</p>
        </div>
        <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-bgray-100 text-bgray-700">{invoice.status}</span>
      </div>

      {notice && <div className="mb-4 rounded-lg bg-success-50 border border-success-100 px-4 py-3 text-success-400 text-sm">{notice}</div>}
      {error && <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">{error}</div>}

      <div className="bg-white dark:bg-darkblack-500 rounded-xl border border-bgray-200 dark:border-darkblack-400 p-6 mb-6 text-sm space-y-1">
        <div className="flex justify-between"><span>Base amount</span><span>Rp {Number(invoice.base_amount).toFixed(2)}</span></div>
        {Number(invoice.ot_hours) > 0 && (
          <div className="flex justify-between"><span>Overtime ({invoice.ot_hours}h @ Rp{invoice.ot_rate}/h)</span><span>Rp {(invoice.ot_hours * invoice.ot_rate).toFixed(2)}</span></div>
        )}
        {Number(invoice.weekend_days) > 0 && (
          <div className="flex justify-between"><span>Weekend ({invoice.weekend_days}d @ Rp{invoice.weekend_rate}/d)</span><span>Rp {(invoice.weekend_days * invoice.weekend_rate).toFixed(2)}</span></div>
        )}
        {Number(invoice.additional_charges) > 0 && (
          <div className="flex justify-between"><span>Additional charges</span><span>Rp {Number(invoice.additional_charges).toFixed(2)}</span></div>
        )}
        {Number(invoice.discount) > 0 && (
          <div className="flex justify-between"><span>Discount</span><span>- Rp {Number(invoice.discount).toFixed(2)}</span></div>
        )}
        <hr className="border-bgray-200 my-2" />
        <div className="flex justify-between"><span>Subtotal</span><span>Rp {Number(invoice.subtotal).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Tax ({invoice.tax_percent}%)</span><span>Rp {Number(invoice.tax_amount).toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold text-base"><span>Total</span><span>Rp {Number(invoice.total_amount).toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Paid</span><span>Rp {Number(invoice.paid_amount).toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold text-error-300"><span>Balance due</span><span>Rp {balance.toFixed(2)}</span></div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <a href={`http://localhost:4000/api/invoices/${id}/pdf`} target="_blank" rel="noreferrer"
          className="px-4 py-2 rounded-lg border border-bgray-300 font-semibold text-sm">View / Download PDF</a>
        {canManage && (
          <>
            <button onClick={sendEmail} disabled={busy} className="px-4 py-2 rounded-lg border border-bgray-300 font-semibold text-sm disabled:opacity-50">Send Email</button>
            <button onClick={shareWhatsapp} className="px-4 py-2 rounded-lg border border-success-300 text-success-400 font-semibold text-sm">Share via WhatsApp</button>
          </>
        )}
      </div>

      {canManage && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-bgray-500 uppercase mb-2">Update status</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="Paid amount" className="border border-bgray-300 rounded-lg h-10 px-3 w-36 text-sm" />
            {ALL_STATUSES.filter((s) => invoice.allowed_transitions?.includes(s)).map((s) => (
              <button key={s} disabled={busy} onClick={() => changeStatus(s)}
                className="px-4 py-2 rounded-lg border border-success-300 text-success-400 font-semibold text-sm disabled:opacity-50">
                Mark {s}
              </button>
            ))}
            {(!invoice.allowed_transitions || invoice.allowed_transitions.length === 0) && (
              <span className="text-sm text-bgray-500">Fully paid — no further transitions.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
