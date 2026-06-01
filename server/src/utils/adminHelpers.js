/**
 * @param {Array<{ fullName: string; email: string }>} users
 * @param {string} [q]
 */
export function filterByQuery(users, q) {
  if (!q?.trim()) {
    return users;
  }

  const needle = q.trim().toLowerCase();
  return users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle),
  );
}

/**
 * @param {Array<unknown>} items
 * @param {number} page
 * @param {number} limit
 */
export function paginate(items, page, limit) {
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total,
  };
}

/**
 * @param {object} attendance
 * @param {{ fullName: string; email: string }} user
 */
export function enrichAttendanceRow(attendance, user) {
  return {
    attendance,
    fullName: user.fullName,
    email: user.email,
  };
}
