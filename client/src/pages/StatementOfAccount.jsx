import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function StatementOfAccount() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/clients/${id}/statement`)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load statement'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-error-300">{error}</div>;
  if (!data) return null;

  const { client, invoices, outstandingBalance } = data;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white">Statement of Account</h1>
          <p className="text-bgray-600">{client.company_name}</p>
        </div>
        <a href={`http://localhost:4000/api/clients/${id}/statement/pdf`} target="_blank" rel="noreferrer"
          className="px-4 py-2 rounded-lg bg-success-300 hover:bg-success-400 text-white text-sm font-semibold">
          Download PDF
        </a>
      </div>

      <div className="bg-white dark:bg-darkblack-500 rounded-xl border border-bgray-200 dark:border-darkblack-400 overflow-x-auto mb-6">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-bgray-200 dark:border-darkblack-400">
              <th className="px-4 py-3 text-left text-xs font-semibold text-bgray-500 uppercase">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-bgray-500 uppercase">Due</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-bgray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-bgray-500 uppercase">Paid</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-bgray-500 uppercase">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-bgray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-bgray-500">No invoices yet.</td></tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-bgray-100 dark:border-darkblack-400 last:border-0">
                <td className="px-4 py-3">
                  <Link to={`/invoices/${inv.id}`} className="font-medium text-success-400">{inv.invoice_no}</Link>
                </td>
                <td className="px-4 py-3 text-bgray-600">{String(inv.due_date).slice(0, 10)}</td>
                <td className="px-4 py-3 text-bgray-600">Rp {Number(inv.total_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-bgray-600">Rp {Number(inv.paid_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-bgray-600">Rp {(inv.total_amount - inv.paid_amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-bgray-600">{inv.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-error-50 border border-error-100 rounded-xl p-4 flex justify-between items-center">
        <span className="font-semibold text-error-300">Outstanding balance</span>
        <span className="font-bold text-lg text-error-300">Rp {Number(outstandingBalance).toFixed(2)}</span>
      </div>
    </div>
  );
}
