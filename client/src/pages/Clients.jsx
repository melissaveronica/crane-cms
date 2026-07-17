import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTable } from '../hooks/useTable';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const SortHeader = ({ label, col, params, toggleSort }) => (
  <th
    onClick={() => toggleSort(col)}
    className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50 cursor-pointer select-none"
  >
    {label}{params.sort === col ? (params.order === 'asc' ? ' ▲' : ' ▼') : ''}
  </th>
);

export default function Clients() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'sales';
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);
  const { data, meta, loading, error, params, setParam, toggleSort, refresh } = useTable('/clients');

  // push the debounced value into the query params
  useEffect(() => { setParam('search', debouncedSearch); }, [debouncedSearch]);

  const approve = async (id, status) => {
    await api.patch(`/clients/${id}/status`, { status });
    refresh();
  };

  const remove = async (id) => {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    await api.delete(`/clients/${id}`);
    refresh();
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white">Clients</h1>
        {canManage && (
          <Link
            to="/clients/new"
            className="rounded-lg bg-success-300 px-6 py-3 text-sm font-semibold text-white hover:bg-success-400"
          >
            Add Client
          </Link>
        )}
      </div>

      {/* filter bar, adapted from users.html search row */}
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
            placeholder="Search company, PIC, email, registration no…"
            className="w-full border-0 bg-transparent px-3 focus:border-none focus:outline-none focus:ring-0 dark:text-white"
          />
        </div>
        <select
          value={params.industry || ''}
          onChange={(e) => setParam('industry', e.target.value)}
          className="rounded-lg border border-bgray-300 dark:border-darkblack-400 dark:bg-darkblack-600 dark:text-white h-11 px-3 text-sm"
        >
          <option value="">All industries</option>
          <option value="Construction">Construction</option>
          <option value="Logistics">Logistics</option>
        </select>
      </div>

      <div className="w-full overflow-x-auto rounded-lg bg-white p-4 dark:bg-darkblack-600">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-bgray-200 dark:border-darkblack-400">
              <SortHeader label="Company" col="company_name" params={params} toggleSort={toggleSort} />
              <SortHeader label="Industry" col="industry" params={params} toggleSort={toggleSort} />
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50">PIC</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold text-bgray-700 dark:text-bgray-50">Orders</th>
              {canManage && <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-bgray-700 dark:text-bgray-50">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-bgray-500">Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-error-300">{error}</td></tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-bgray-500">No clients found.</td></tr>
            )}
            {!loading && !error && data.map((c) => (
              <tr key={c.id} className="border-b border-bgray-100 dark:border-darkblack-400 last:border-0">
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-bgray-900 dark:text-white">{c.company_name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{c.industry || '—'}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{c.pic_name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm">
                  <span className={`rounded-lg px-3 py-1 text-sm font-medium dark:bg-darkblack-500 ${
                    c.account_status === 'approved' ? 'bg-success-50 text-success-300' :
                    c.account_status === 'rejected' ? 'bg-error-50 text-error-300' :
                    'bg-bamber-50 text-bamber-500'
                  }`}>
                    {c.account_status || 'n/a'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-bgray-600 dark:text-bgray-100">{c.order_count}</td>
                {canManage && (
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-4">
                      {c.account_status === 'pending' && (
                        <>
                          <button onClick={() => approve(c.id, 'approved')} className="font-semibold text-success-300">Approve</button>
                          <button onClick={() => approve(c.id, 'rejected')} className="font-semibold text-error-300">Reject</button>
                        </>
                      )}
                      <Link to={`/clients/${c.id}/statement`} className="font-semibold text-bgray-600 dark:text-bgray-100">Statement</Link>
                      <Link to={`/clients/${c.id}/edit`} className="font-semibold text-bgray-600 dark:text-bgray-100">Edit</Link>
                      <button onClick={() => remove(c.id)} className="font-semibold text-error-300">Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination footer, styled like Bankco's success-accented controls */}
      <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm text-bgray-600 dark:bg-darkblack-600 dark:text-bgray-100">
        <span>Page {meta.page} of {meta.pages} ({meta.total} total)</span>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1}
            onClick={() => setParam('page', meta.page - 1)}
            className="rounded-lg border border-success-300 px-4 py-2 font-semibold text-success-300 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={meta.page >= meta.pages}
            onClick={() => setParam('page', meta.page + 1)}
            className="rounded-lg bg-success-300 px-4 py-2 font-semibold text-white hover:bg-success-400 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
