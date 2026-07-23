import { useEffect, useState } from 'react';
import api from '../lib/api.js';

const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fmtDate = (d) => new Date(d).toLocaleDateString();

// API requires the JWT header, so PDFs are fetched as blobs — a plain <a href> would 401
async function downloadPdf(path, filename) {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg bg-white dark:bg-darkblack-600 p-5">
      <h2 className="mb-4 font-poppins font-semibold text-bgray-900 dark:text-white">{title}</h2>
      {children}
    </div>
  );
}

const Empty = ({ text }) => <p className="font-urbanist text-sm text-bgray-500">{text}</p>;

export default function Documents() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/me/documents')
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || err.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="p-6 font-urbanist text-error-300">Failed to load documents: {error}</div>;
  if (!data) return (
    <div className="p-6 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-bgray-200 dark:bg-darkblack-500 animate-pulse" />)}
    </div>
  );

  const { attachments, invoices, client_id } = data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-poppins font-semibold text-bgray-900 dark:text-white">Documents</h1>

      <Section title="Order files">
        {attachments.length === 0 ? <Empty text="No files yet." /> : (
          <div className="overflow-x-auto">
            <table className="w-full font-urbanist text-sm">
              <thead>
                <tr className="text-left text-bgray-600 dark:text-bgray-100 border-b border-bgray-200 dark:border-darkblack-400">
                  <th className="py-2 pr-4">File</th><th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Type</th><th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Uploaded</th><th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((f) => (
                  <tr key={f.id} className="border-b border-bgray-100 dark:border-darkblack-500 text-bgray-900 dark:text-white">
                    <td className="py-2 pr-4">{f.original_name}</td>
                    <td className="py-2 pr-4">{f.order_no} — {f.project_name}</td>
                    <td className="py-2 pr-4">{f.mime_type}</td>
                    <td className="py-2 pr-4">{fmtSize(f.size_bytes)}</td>
                    <td className="py-2 pr-4">{fmtDate(f.uploaded_at)}</td>
                    <td className="py-2">
                      <a href={`http://localhost:4000${f.file_path}`} target="_blank" rel="noreferrer"
                        className="font-semibold text-success-400">Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Invoice PDFs">
        {invoices.length === 0 ? <Empty text="No invoices yet." /> : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between font-urbanist text-sm text-bgray-900 dark:text-white">
                <span>{inv.invoice_no} · {inv.status} · {fmtDate(inv.created_at)}</span>
                <button onClick={() => downloadPdf(`/invoices/${inv.id}/pdf`, `${inv.invoice_no}.pdf`)}
                  className="px-3 py-1 rounded-lg border border-bgray-300 dark:border-darkblack-400 font-semibold">
                  Download PDF
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Statement of Account">
        <button onClick={() => downloadPdf(`/clients/${client_id}/statement/pdf`, 'statement-of-account.pdf')}
          className="px-4 py-2 rounded-lg bg-success-300 font-poppins font-semibold text-white">
          Download SOA PDF
        </button>
      </Section>
    </div>
  );
}
