/**
 * @param {unknown} raw
 * @returns {import('../models/board').Board}
 */
function normalizeBoard(raw) {
  if (Array.isArray(raw)) {
    const todos = raw.map((t, i) => ({
      ...t,
      columnId: 1,
      sortOrder: i,
      description: typeof t.description === 'string' ? t.description : '',
      label: normalizeLabel(t.label),
      assigneeId: normalizeAssigneeId(t.assigneeId),
      checklist: normalizeChecklist(t.checklist),
    }));
    return {
      columns: [{ id: 1, title: 'TO DO', order: 0 }],
      todos,
    };
  }
  if (raw && Array.isArray(raw.columns) && Array.isArray(raw.todos)) {
    let columns = raw.columns.map((c) => ({
      id: Number(c.id),
      title: String(c.title ?? 'Column'),
      order: typeof c.order === 'number' ? c.order : null,
    }));
    if (columns.length === 0) {
      columns = [{ id: 1, title: 'TO DO', order: 0 }];
    } else {
      const allHaveOrder = columns.every((c) => c.order !== null);
      if (allHaveOrder) {
        columns.sort((a, b) => a.order - b.order || a.id - b.id);
      } else {
        columns.sort((a, b) => a.id - b.id);
      }
      columns.forEach((c, i) => {
        c.order = i;
      });
    }
    const defaultColId = columns[0].id;
    return {
      columns,
      todos: raw.todos.map((t, i) => {
        const checklist = normalizeChecklist(t.checklist);
        return {
          ...t,
          columnId: Number(t.columnId) || defaultColId,
          sortOrder: typeof t.sortOrder === 'number' ? t.sortOrder : i,
          description: typeof t.description === 'string' ? t.description : '',
          dueDate: normalizeDueDateField(t.dueDate),
          label: normalizeLabel(t.label),
          assigneeId: normalizeAssigneeId(t.assigneeId),
          checklist,
        };
      }),
    };
  }
  return {
    columns: [{ id: 1, title: 'TO DO', order: 0 }],
    todos: [],
  };
}

/** @returns {number|null} */
function normalizeLabel(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i < 0 || i > 10) return null;
  return i;
}

/** Board member id from client dummy data; null = unassigned */
function normalizeAssigneeId(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i < 1 || i > 99) return null;
  return i;
}

/** @returns {string|null} ISO calendar date YYYY-MM-DD or null */
function normalizeDueDateField(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const parts = s.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (
    d.getFullYear() !== parts[0] ||
    d.getMonth() !== parts[1] - 1 ||
    d.getDate() !== parts[2]
  ) {
    return null;
  }
  return s;
}

function normalizeChecklist(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({
      id: Number(c.id),
      text: String(c.text ?? '').trim(),
      done: Boolean(c.done),
    }))
    .filter((c) => Number.isFinite(c.id) && c.text.length > 0);
}

module.exports = {
  normalizeBoard,
  normalizeLabel,
  normalizeAssigneeId,
  normalizeDueDateField,
  normalizeChecklist,
};
