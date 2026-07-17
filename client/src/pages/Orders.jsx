import { Link } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLE = {
  pending:   'bg-bgray-100 text-bgray-600',
  review:    'bg-bamber-50 text-bamber-500',
  quotation: 'bg-bamber-50 text-bamber-500',
  approved:  'bg-success-50 text-success-300',
  running:   'bg-bamber-50 text-bamber-500',
  completed: 'bg-success-50 text-success-300',
  rejected:  'bg-error-50 text-error-300',
};

export default function Orders() {
  const { user } = useAuth();
  const { data, meta, loading, error, params, setParam, toggleSort } = useTable('/orders');

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white">Orders</h1>
        <Link
          to="/orders/new"
          className="rounded-lg bg-success-300 px-6 py-3 text-sm font-semibold text-white hover:bg-success-400"
        >
          New Order
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-lg bg-white p-4 dark:bg-darkblack-600 md:flex-row md:items-center">
        <select
          value={params.status || ''}
          onChange={(e) => setParam('status', e.target.value)}
          className="rounded-lg border border-bgray-300 dark:border-darkblack-400 dark:bg-darkblack-600 dark:text-white h-11 px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="w-full overflow-x-auto rounded-lg bg-white p-4 dark:bg-darkblack-600">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-bgray-200 dark:border-darkblack-400">
              <th onClick={() => toggleSort('order_no')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Order No</th>
              <th onClick={() => toggleSort('project_name')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Project</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50">Client</th>
              <th onClick={() => toggleSort('start_date')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Start</th>
              <th onClick={() => toggleSort('status')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-bgray-500">Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-error-300">{error}</td></tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-bgray-500">No orders found.</td></tr>
            )}
            {!loading && !error && data.map((o) => (
              <tr key={o.id} className="border-b border-bgray-100 dark:border-darkblack-400 last:border-0 hover:bg-bgray-50 dark:hover:bg-darkblack-400">
                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <Link to={`/orders/${o.id}`} className="font-semibold text-success-300">{o.order_no}</Link>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-bgray-900 dark:text-white">{o.project_name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{o.company_name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{o.start_date?.slice(0, 10)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <span className={`rounded-lg px-3 py-1 text-sm font-medium dark:bg-darkblack-500 ${STATUS_STYLE[o.status] || ''}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm text-bgray-600 dark:bg-darkblack-600 dark:text-bgray-100">
        <span>Page {meta.page} of {meta.pages} ({meta.total} total)</span>
        <div className="flex gap-2">
          <button disabled={meta.page <= 1} onClick={() => setParam('page', meta.page - 1)}
            className="rounded-lg border border-success-300 px-4 py-2 font-semibold text-success-300 disabled:opacity-40">Prev</button>
          <button disabled={meta.page >= meta.pages} onClick={() => setParam('page', meta.page + 1)}
            className="rounded-lg bg-success-300 px-4 py-2 font-semibold text-white hover:bg-success-400 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
