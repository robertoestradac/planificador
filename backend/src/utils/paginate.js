/**
 * Reusable pagination helper.
 *
 * Usage in a controller:
 *   const { page, limit, offset } = parsePagination(req.query);
 *   const [rows] = await pool.query('SELECT ... LIMIT ? OFFSET ?', [limit, offset]);
 *   const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ...');
 *   return success(res, paginatedResponse(rows, total, page, limit));
 */

/**
 * Parse page/limit from query params with safe defaults and caps.
 * @param {object} query - req.query
 * @param {object} [opts]
 * @param {number} [opts.defaultLimit=20]
 * @param {number} [opts.maxLimit=100]
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query, opts = {}) {
  const { defaultLimit = 20, maxLimit = 100 } = opts;

  let page = parseInt(query.page, 10);
  if (!page || page < 1) page = 1;

  let limit = parseInt(query.limit, 10);
  if (!limit || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build a standard paginated response envelope.
 * @param {Array} data - rows for the current page
 * @param {number} total - total row count (without LIMIT)
 * @param {number} page - current page (1-indexed)
 * @param {number} limit - items per page
 */
function paginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

module.exports = { parsePagination, paginatedResponse };
