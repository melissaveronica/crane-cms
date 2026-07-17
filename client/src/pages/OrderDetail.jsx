import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const ALL_STATUSES = ['pending', 'review', 'quotation', 'approved', 'running', 'completed', 'rejected'];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const canChangeStatus = ['admin', 'sales', 'operation'].includes(user?.role);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    setBusy(true);
    try {
      await api.patch(`/orders/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Status change failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error && !order) return <div className="p-6 text-error-300">{error}</div>;
  if (!order) return null;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-poppins font-semibold text-bgray-900 dark:text-white">{order.order_no}</h1>
          <p className="text-bgray-600">{order.company_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold px-3 py-1.5 rounded-full bg-bgray-100 text-bgray-700">
            {order.status}
          </span>
          {canChangeStatus && (
            <Link to={`/invoices/new?order_id=${order.id}`}
              className="px-4 py-2 rounded-lg bg-success-300 hover:bg-success-400 text-white text-sm font-semibold">
              Generate Invoice
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-error-50 border border-error-100 px-4 py-3 text-error-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-darkblack-500 rounded-xl border border-bgray-200 dark:border-darkblack-400 p-6 mb-6 grid grid-cols-2 gap-4">
        <div><span className="text-xs text-bgray-500 uppercase">Project</span><p>{order.project_name}</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">Location</span><p>{order.location}</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">Start</span><p>{order.start_date?.slice(0, 10)}</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">End</span><p>{order.end_date?.slice(0, 10)}</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">Crane Type</span><p>{order.crane_type}</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">Capacity</span><p>{order.capacity_tonnes} t</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">Load Weight</span><p>{order.load_weight_kg} kg</p></div>
        <div><span className="text-xs text-bgray-500 uppercase">Lift Height</span><p>{order.lift_height_m} m</p></div>
        {order.site_condition && (
          <div className="col-span-2"><span className="text-xs text-bgray-500 uppercase">Site Condition</span><p>{order.site_condition}</p></div>
        )}
      </div>

      {canChangeStatus && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-bgray-500 uppercase mb-2">Move to</h2>
          <div className="flex gap-2 flex-wrap">
            {ALL_STATUSES.filter((s) => order.allowed_transitions?.includes(s)).map((s) => (
              <button key={s} disabled={busy} onClick={() => changeStatus(s)}
                className="px-4 py-2 rounded-lg border border-success-300 text-success-400 font-semibold disabled:opacity-50">
                {s}
              </button>
            ))}
            {(!order.allowed_transitions || order.allowed_transitions.length === 0) && (
              <span className="text-sm text-bgray-500">No further transitions — final status.</span>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-bgray-500 uppercase mb-2">Attachments</h2>
        {order.attachments?.length === 0 && <p className="text-bgray-500 text-sm">No attachments.</p>}
        <div className="grid grid-cols-4 gap-3">
          {order.attachments?.map((a) => (
            <a key={a.id} href={`http://localhost:4000${a.file_path}`} target="_blank" rel="noreferrer"
              className="block border border-bgray-200 rounded-lg p-2 text-xs text-bgray-600 truncate hover:border-success-300">
              {a.mime_type?.startsWith('image/')
                ? <img src={`http://localhost:4000${a.file_path}`} alt={a.original_name} className="rounded mb-1 h-20 w-full object-cover" />
                : <div className="h-20 flex items-center justify-center bg-bgray-50 rounded mb-1">PDF</div>}
              {a.original_name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
