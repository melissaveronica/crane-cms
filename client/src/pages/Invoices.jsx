import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { useDebounce } from '../hooks/useDebounce';

const STATUS_STYLE = {
  draft:   'bg-bgray-100 text-bgray-600',
  sent:    'bg-bamber-50 text-bamber-500',
  paid:    'bg-success-50 text-success-300',
  partial: 'bg-bamber-50 text-bamber-500',
  overdue: 'bg-error-50 text-error-300',
};

export default function Invoices() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);
  const { data, meta, loading, error, params, setParam, toggleSort } = useTable('/invoices');

  // push the debounced value into the query params
  useEffect(() => { setParam('search', debouncedSearch); }, [debouncedSearch]);

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white">Invoices</h1>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-lg bg-white p-4 dark:bg-darkblack-600 md:flex-row md:items-center">
        <div className="flex flex-1 items-center border-bgray-400 pl-4 dark:border-darkblack-400 md:border-r">
          <span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 21L17 17" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search invoice no or company…"
            className="w-full border-0 bg-transparent px-3 focus:border-none focus:outline-none focus:ring-0 dark:text-white"
          />
        </div>
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
              <th onClick={() => toggleSort('invoice_no')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Invoice No</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50">Client</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50">Order</th>
              <th onClick={() => toggleSort('total_amount')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Total</th>
              <th onClick={() => toggleSort('due_date')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Due</th>
              <th onClick={() => toggleSort('status')} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-bgray-500">Loading…</td></tr>}
            {!loading && error && <tr><td colSpan={6} className="px-4 py-8 text-center text-error-300">{error}</td></tr>}
            {!loading && !error && data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-bgray-500">No invoices yet.</td></tr>
            )}
            {!loading && !error && data.map((inv) => (
              <tr key={inv.id} className="border-b border-bgray-100 dark:border-darkblack-400 last:border-0 hover:bg-bgray-50 dark:hover:bg-darkblack-400">
                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <Link to={`/invoices/${inv.id}`} className="font-semibold text-success-300">{inv.invoice_no}</Link>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-bgray-900 dark:text-white">{inv.company_name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{inv.order_no}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">Rp {Number(inv.total_amount).toFixed(2)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{String(inv.due_date).slice(0, 10)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <span className={`rounded-lg px-3 py-1 text-sm font-medium dark:bg-darkblack-500 ${STATUS_STYLE[inv.status] || ''}`}>{inv.status}</span>
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
