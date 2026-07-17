import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export function useTable(endpoint, initialFilters = {}) {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [params, setParams] = useState({
    page: 1, limit: 10, search: '', sort: 'created_at', order: 'desc', ...initialFilters,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
      const { data: res } = await api.get(endpoint, { params: clean });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // any filter change resets to page 1 — otherwise you land on an empty page 5
  const setParam = (key, value) =>
    setParams((p) => ({ ...p, [key]: value, page: key === 'page' ? value : 1 }));

  const toggleSort = (col) =>
    setParams((p) => ({
      ...p, sort: col,
      order: p.sort === col && p.order === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));

  return { data, meta, loading, error, params, setParam, toggleSort, refresh: fetchData };
}
