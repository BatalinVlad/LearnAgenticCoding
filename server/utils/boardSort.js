/**
 * @param {import('../models/board').Todo[]} list
 */
function sortTodos(list) {
  return [...list].sort((a, b) => {
    if (a.columnId !== b.columnId) return a.columnId - b.columnId;
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * @param {import('../models/board').Column[]} cols
 */
function sortColumns(cols) {
  return [...cols].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : a.id;
    const ob = typeof b.order === 'number' ? b.order : b.id;
    if (oa !== ob) return oa - ob;
    return a.id - b.id;
  });
}

module.exports = { sortTodos, sortColumns };
