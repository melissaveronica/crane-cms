/**
 * Builds the WHERE/ORDER BY/LIMIT tail of a list query.
 * sortable: whitelist of column names that may be sorted on.
 */
export function buildList(params, { sortable, searchable, defaultSort }) {
  const page  = Math.max(1, parseInt(params.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));
  const offset = (page - 1) * limit;

  const where = [];
  const values = [];

  if (params.search && searchable.length) {
    values.push(`%${params.search}%`);
    const idx = values.length;
    where.push(`(${searchable.map((c) => `${c} ILIKE $${idx}`).join(' OR ')})`);
  }

  // NEVER interpolate a sort column without whitelisting it — that's SQL injection.
  const sort = sortable.includes(params.sort) ? params.sort : defaultSort;
  const order = params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return { page, limit, offset, where, values, orderBy: `${sort} ${order}` };
}

export function addFilter(state, sql, value) {
  if (value === undefined || value === '' || value === null) return;
  state.values.push(value);
  state.where.push(sql.replace('$?', `$${state.values.length}`));
}

export const whereClause = (where) => (where.length ? `WHERE ${where.join(' AND ')}` : '');

export const meta = (page, limit, total) => ({
  page, limit, total: Number(total), pages: Math.ceil(total / limit) || 1,
});
