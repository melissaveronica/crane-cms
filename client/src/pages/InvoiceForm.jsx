import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

const empty = {
  order_id: '', base_amount: '', ot_hours: '0', ot_rate: '0',
  weekend_days: '0', weekend_rate: '0', additional_charges: '0', discount: '0',
  tax_percent: '6', due_date: '', notes: '',
};

export default function InvoiceForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...empty, order_id: searchParams.get('order_id') || '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!form.order_id) return;
    api.get(`/orders/${form.order_id}`).then((res) => setOrder(res.data)).catch(() => setOrder(null));
  }, [form.order_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // preview only — the server recomputes and owns the real total
  const preview = useMemo(() => {
    const n = (v) => Number(v) || 0;
    const otAmount = n(form.ot_hours) * n(form.ot_rate);
    const weekendAmount = n(form.weekend_days) * n(form.weekend_rate);
    const subtotal = n(form.base_amount) + otAmount + weekendAmount + n(form.additional_charges) - n(form.discount);
    const taxAmount = subtotal * (n(form.tax_percent) / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/invoices', form);
      navigate(`/invoices/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white mb-2">New Invoice</h1>
      {order && (
        <p className="text-sm text-bgray-600 mb-6">
          For order <span className="font-semibold">{order.order_no}</span> — {order.project_name} ({order.company_name})
        </p>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <input type="number" name="order_id" value={form.order_id} onChange={handleChange} required
          placeholder="Order ID" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        <input type="number" step="0.01" name="base_amount" value={form.base_amount} onChange={handleChange} required
          placeholder="Base amount (RM)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />

        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.01" name="ot_hours" value={form.ot_hours} onChange={handleChange}
            placeholder="OT hours" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          <input type="number" step="0.01" name="ot_rate" value={form.ot_rate} onChange={handleChange}
            placeholder="OT rate (RM/hr)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.01" name="weekend_days" value={form.weekend_days} onChange={handleChange}
            placeholder="Weekend days" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          <input type="number" step="0.01" name="weekend_rate" value={form.weekend_rate} onChange={handleChange}
            placeholder="Weekend rate (RM/day)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.01" name="additional_charges" value={form.additional_charges} onChange={handleChange}
            placeholder="Additional charges (RM)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          <input type="number" step="0.01" name="discount" value={form.discount} onChange={handleChange}
            placeholder="Discount (RM)" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="0.01" name="tax_percent" value={form.tax_percent} onChange={handleChange}
            placeholder="Tax %" className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
          <input type="date" name="due_date" value={form.due_date} onChange={handleChange} required
            className="border border-bgray-300 rounded-lg h-12 w-full px-4" />
        </div>
        <textarea name="notes" value={form.notes} onChange={handleChange}
          placeholder="Notes (optional)" rows={3} className="border border-bgray-300 rounded-lg w-full px-4 py-3" />

        <div className="bg-bgray-50 dark:bg-darkblack-400 rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>Rp {preview.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>Rp {preview.taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-base"><span>Total</span><span>Rp {preview.total.toFixed(2)}</span></div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={busy}
            className="px-5 py-2.5 rounded-lg bg-success-300 hover:bg-success-400 disabled:opacity-50 text-white font-semibold">
            {busy ? 'Creating…' : 'Create Invoice'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-bgray-300 font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
