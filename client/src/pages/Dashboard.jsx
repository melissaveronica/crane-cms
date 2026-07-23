import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

const SERIES = '#16A34A'; // success-400 — validated for light & dark surfaces
const fmtRp = (n) =>
  'Rp ' + Number(n).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// recessive grid/axes; no legend (single series); tooltips = the hover layer
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#A0AEC0', font: { family: 'Urbanist' } } },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(160,174,192,0.15)' },
      ticks: { color: '#A0AEC0', font: { family: 'Urbanist' } },
    },
  },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-white dark:bg-darkblack-600 p-5">
      <p className="text-sm font-urbanist font-medium text-bgray-600 dark:text-bgray-100">{label}</p>
      <p className="mt-1 text-2xl font-poppins font-bold text-bgray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs font-urbanist text-bgray-500">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg bg-white dark:bg-darkblack-600 p-5">
      <h2 className="mb-4 font-poppins font-semibold text-bgray-900 dark:text-white">{title}</h2>
      <div className="h-64">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setError(null);
    api.get('/dashboard/stats')
      .then((res) => { if (!cancelled) setStats(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || err.message); });
    return () => { cancelled = true; };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-poppins font-semibold text-bgray-900 dark:text-white mb-2">
          Welcome{user ? `, ${user.email}` : ''}
        </h1>
        <p className="font-urbanist text-bgray-600 dark:text-bgray-100">Role: {user?.role}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-error-50 dark:bg-darkblack-600 p-4 font-urbanist text-error-300">
          Failed to load dashboard: {error}{' '}
          <button onClick={() => { setStats(null); setError(null); api.get('/dashboard/stats').then((r) => setStats(r.data)).catch((e) => setError(e.response?.data?.error || e.message)); }}
            className="ml-2 underline font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-bgray-200 dark:bg-darkblack-500 animate-pulse" />
        ))}
      </div>
    );
  }

  const { revenue, outstanding, runningProjects, fleetUtilization, customerGrowth } = stats;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-poppins font-semibold text-bgray-900 dark:text-white">
        Owner Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Revenue (collected)" value={fmtRp(revenue.total)} />
        <StatCard label="Outstanding" value={fmtRp(outstanding)} />
        <StatCard label="Running Projects" value={runningProjects} />
        <StatCard label="Fleet Utilization" value={`${fleetUtilization.overallPct}%`}
          sub="running / active orders" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Revenue — last 6 months">
          <Line
            data={{
              labels: revenue.monthly.map((m) => m.month),
              datasets: [{
                data: revenue.monthly.map((m) => m.amount),
                borderColor: SERIES, borderWidth: 2,
                pointRadius: 4, pointBackgroundColor: SERIES,
                fill: true, backgroundColor: 'rgba(22,163,74,0.08)', tension: 0.3,
              }],
            }}
            options={baseOptions}
          />
        </ChartCard>
        <ChartCard title="Customer growth — new clients per month">
          <Bar
            data={{
              labels: customerGrowth.monthly.map((m) => m.month),
              datasets: [{
                data: customerGrowth.monthly.map((m) => m.count),
                backgroundColor: SERIES, borderRadius: 4, maxBarThickness: 32,
              }],
            }}
            options={{ ...baseOptions,
              scales: { ...baseOptions.scales,
                y: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, precision: 0 } } } }}
          />
        </ChartCard>
      </div>

      <div className="rounded-lg bg-white dark:bg-darkblack-600 p-5">
        <h2 className="mb-4 font-poppins font-semibold text-bgray-900 dark:text-white">
          Fleet utilization by crane type
        </h2>
        <ul className="space-y-3">
          {fleetUtilization.byCraneType.map((f) => (
            <li key={f.crane_type} className="font-urbanist">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-bgray-900 dark:text-white">{f.crane_type}</span>
                <span className="text-bgray-600 dark:text-bgray-100">
                  {f.running}/{f.total} running · {f.pct}%
                </span>
              </div>
              <div className="h-2 rounded bg-bgray-200 dark:bg-darkblack-500">
                <div className="h-2 rounded" style={{ width: `${f.pct}%`, backgroundColor: SERIES }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
