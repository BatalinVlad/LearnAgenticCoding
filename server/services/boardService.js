const {
  normalizeLabel,
  normalizeAssigneeId,
  normalizeDueDateField,
} = require('../utils/boardNormalize');
const { sortTodos, sortColumns } = require('../utils/boardSort');

/**
 * @param {{ load: () => import('../models/board').Board; save: (b: import('../models/board').Board) => void }} repository
 */
function createBoardService(repository) {
  /** @type {import('../models/board').Board} */
  let board = repository.load();

  let nextTodoId =
    board.todos.length === 0
      ? 1
      : Math.max(...board.todos.map((t) => t.id)) + 1;
  let nextColumnId =
    board.columns.length === 0
      ? 1
      : Math.max(...board.columns.map((c) => c.id)) + 1;

  function refreshChecklistItemIdCounter() {
    let max = 0;
    for (const t of board.todos) {
      for (const c of t.checklist || []) {
        if (typeof c.id === 'number' && c.id > max) max = c.id;
      }
    }
    return max + 1;
  }

  let nextChecklistItemId = refreshChecklistItemIdCounter();

  function persist() {
    repository.save(board);
  }

  function ensureColumnOrders() {
    board.columns = sortColumns(board.columns);
    board.columns.forEach((c, i) => {
      c.order = i;
    });
  }

  board.todos = sortTodos(board.todos);
  ensureColumnOrders();

  function getBoard() {
    return {
      columns: sortColumns(board.columns),
      todos: sortTodos(board.todos),
    };
  }

  function createColumn(body) {
    const n = board.columns.length + 1;
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : `COLUMN ${n}`;
    const order =
      board.columns.length === 0
        ? 0
        : Math.max(
            ...board.columns.map((c) =>
              typeof c.order === 'number' ? c.order : 0,
            ),
          ) + 1;
    const col = { id: nextColumnId++, title, order };
    board.columns.push(col);
    ensureColumnOrders();
    persist();
    return col;
  }

  function reorderColumns(ids) {
    ids.forEach((id, i) => {
      const c = board.columns.find((x) => x.id === id);
      if (c) c.order = i;
    });
    board.columns = sortColumns(board.columns);
    persist();
    return sortColumns(board.columns);
  }

  function patchColumn(id, body) {
    const col = board.columns.find((c) => c.id === id);
    if (!col) return { error: 'not_found', status: 404 };
    const title = String(body.title ?? '').trim();
    if (!title) return { error: 'title_required', status: 400 };
    col.title = title;
    persist();
    return { column: col };
  }

  function deleteColumn(id) {
    if (board.columns.length <= 1) {
      return { error: 'last_column', status: 400 };
    }
    const idx = board.columns.findIndex((c) => c.id === id);
    if (idx === -1) return { error: 'not_found', status: 404 };

    const others = board.columns.filter((c) => c.id !== id);
    const fallbackId = [...others].sort((a, b) => a.id - b.id)[0].id;

    board.todos.forEach((t) => {
      if (t.columnId === id) {
        t.columnId = fallbackId;
      }
    });

    function reindexColumn(columnId) {
      const list = board.todos
        .filter((t) => t.columnId === columnId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      list.forEach((t, i) => {
        t.sortOrder = i;
      });
    }
    reindexColumn(fallbackId);

    board.columns.splice(idx, 1);
    ensureColumnOrders();
    persist();
    return {
      board: {
        columns: sortColumns(board.columns),
        todos: sortTodos(board.todos),
      },
    };
  }

  function moveTodo(body) {
    const id = Number(body.id);
    const toColumnId = Number(body.toColumnId);
    const toIndex = Number(body.toIndex);
    if (
      !Number.isFinite(id) ||
      !Number.isFinite(toColumnId) ||
      !Number.isFinite(toIndex) ||
      toIndex < 0
    ) {
      return { error: 'bad_request', status: 400 };
    }
    if (!board.columns.some((c) => c.id === toColumnId)) {
      return { error: 'invalid_column', status: 400 };
    }
    const t = board.todos.find((x) => x.id === id);
    if (!t) return { error: 'not_found', status: 404 };

    const fromColumnId = t.columnId;

    if (fromColumnId === toColumnId) {
      const colTodos = board.todos
        .filter((x) => x.columnId === fromColumnId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const fromIdx = colTodos.findIndex((x) => x.id === id);
      if (fromIdx === -1) return { error: 'bad_state', status: 400 };
      const next = [...colTodos];
      const [moved] = next.splice(fromIdx, 1);
      const safeIdx = Math.min(Math.max(0, toIndex), next.length);
      next.splice(safeIdx, 0, moved);
      next.forEach((item, i) => {
        const it = board.todos.find((x) => x.id === item.id);
        if (it) it.sortOrder = i;
      });
    } else {
      const sourceTodos = board.todos
        .filter((x) => x.columnId === fromColumnId && x.id !== id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const destTodos = board.todos
        .filter((x) => x.columnId === toColumnId && x.id !== id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const safeIdx = Math.min(Math.max(0, toIndex), destTodos.length);
      t.columnId = toColumnId;
      destTodos.splice(safeIdx, 0, t);
      sourceTodos.forEach((item, i) => {
        const it = board.todos.find((x) => x.id === item.id);
        if (it) it.sortOrder = i;
      });
      destTodos.forEach((item, i) => {
        const it = board.todos.find((x) => x.id === item.id);
        if (it) it.sortOrder = i;
      });
    }

    board.todos = sortTodos(board.todos);
    persist();
    return { todos: board.todos };
  }

  function createTodo(body) {
    const text = String(body.text ?? '').trim();
    const photo = typeof body.photo === 'string' ? body.photo : null;
    const columnId = Number(body.columnId);
    if (!text) return { error: 'text_required', status: 400 };
    if (
      !Number.isFinite(columnId) ||
      !board.columns.some((c) => c.id === columnId)
    ) {
      return { error: 'column_required', status: 400 };
    }
    const inColumn = board.todos.filter((t) => t.columnId === columnId);
    const maxOrder =
      inColumn.length === 0
        ? -1
        : Math.max(...inColumn.map((t) => t.sortOrder));
    const item = {
      id: nextTodoId++,
      text,
      done: false,
      photo,
      columnId,
      sortOrder: maxOrder + 1,
      dueDate: normalizeDueDateField(body.dueDate),
      description: '',
      label: null,
      assigneeId: null,
      checklist: [],
    };
    board.todos.push(item);
    persist();
    return { todo: item };
  }

  function duplicateTodo(id) {
    const source = board.todos.find((t) => t.id === id);
    if (!source) return { error: 'not_found', status: 404 };
    const columnId = source.columnId;
    for (const t of board.todos) {
      if (t.columnId === columnId && t.sortOrder > source.sortOrder) {
        t.sortOrder += 1;
      }
    }
    const checklist = Array.isArray(source.checklist)
      ? source.checklist
          .filter((c) => c && String(c.text ?? '').trim().length > 0)
          .map((c) => ({
            id: nextChecklistItemId++,
            text: String(c.text ?? '').trim(),
            done: Boolean(c.done),
          }))
      : [];
    const duplicate = {
      id: nextTodoId++,
      text: source.text,
      done: false,
      photo: typeof source.photo === 'string' ? source.photo : null,
      columnId,
      sortOrder: source.sortOrder + 1,
      dueDate: normalizeDueDateField(source.dueDate),
      description:
        typeof source.description === 'string' ? source.description : '',
      label: normalizeLabel(source.label),
      assigneeId: normalizeAssigneeId(source.assigneeId),
      checklist,
    };
    board.todos.push(duplicate);
    board.todos = sortTodos(board.todos);
    persist();
    return { todo: duplicate };
  }

  function patchTodo(id, body) {
    const item = board.todos.find((t) => t.id === id);
    if (!item) return { error: 'not_found', status: 404 };
    if (typeof body.text === 'string') {
      const next = String(body.text).trim();
      if (next) {
        item.text = next;
      }
    }
    if (body.photo === null || typeof body.photo === 'string') {
      item.photo = body.photo;
    }
    if (typeof body.description === 'string') {
      item.description = body.description;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
      item.dueDate = normalizeDueDateField(body.dueDate);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'label')) {
      item.label = normalizeLabel(body.label);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'assigneeId')) {
      item.assigneeId = normalizeAssigneeId(body.assigneeId);
    }
    persist();
    return { todo: item };
  }

  function addChecklistItem(todoId, body) {
    const item = board.todos.find((t) => t.id === todoId);
    if (!item) return { error: 'not_found', status: 404 };
    const text = String(body.text ?? '').trim();
    if (!text) return { error: 'text_required', status: 400 };
    if (!Array.isArray(item.checklist)) {
      item.checklist = [];
    }
    const sub = { id: nextChecklistItemId++, text, done: false };
    item.checklist.push(sub);
    persist();
    return { item: sub };
  }

  function patchChecklistItem(todoId, checklistItemId, body) {
    const item = board.todos.find((t) => t.id === todoId);
    if (!item || !Array.isArray(item.checklist)) {
      return { error: 'not_found', status: 404 };
    }
    const sub = item.checklist.find((c) => c.id === checklistItemId);
    if (!sub) return { error: 'not_found', status: 404 };
    if (typeof body.done === 'boolean') {
      sub.done = body.done;
    }
    if (typeof body.text === 'string') {
      const next = String(body.text).trim();
      if (next) {
        sub.text = next;
      }
    }
    persist();
    return { item: sub };
  }

  function deleteChecklistItem(todoId, checklistItemId) {
    const item = board.todos.find((t) => t.id === todoId);
    if (!item || !Array.isArray(item.checklist)) {
      return { error: 'not_found', status: 404 };
    }
    const idx = item.checklist.findIndex((c) => c.id === checklistItemId);
    if (idx === -1) return { error: 'not_found', status: 404 };
    item.checklist.splice(idx, 1);
    persist();
    return { ok: true };
  }

  function deleteTodo(id) {
    const idx = board.todos.findIndex((t) => t.id === id);
    if (idx === -1) return { error: 'not_found', status: 404 };
    board.todos.splice(idx, 1);
    persist();
    return { ok: true };
  }

  function reorderTodosInColumn(body) {
    const columnId = Number(body.columnId);
    const ids = Array.isArray(body.ids) ? body.ids.map(Number) : null;
    if (!Number.isFinite(columnId) || !ids || ids.some((id) => !Number.isFinite(id))) {
      return { error: 'bad_request', status: 400 };
    }

    const columnTodos = board.todos.filter((t) => t.columnId === columnId);
    if (ids.length !== columnTodos.length) {
      return { error: 'length_mismatch', status: 400 };
    }

    const idSet = new Set(ids);
    if (
      idSet.size !== columnTodos.length ||
      columnTodos.some((t) => !idSet.has(t.id))
    ) {
      return { error: 'ids_mismatch', status: 400 };
    }

    ids.forEach((todoId, index) => {
      const t = board.todos.find((x) => x.id === todoId);
      if (t) t.sortOrder = index;
    });
    board.todos = sortTodos(board.todos);
    persist();
    return { todos: board.todos };
  }

  return {
    getBoard,
    createColumn,
    reorderColumns,
    patchColumn,
    deleteColumn,
    moveTodo,
    createTodo,
    duplicateTodo,
    patchTodo,
    addChecklistItem,
    patchChecklistItem,
    deleteChecklistItem,
    deleteTodo,
    reorderTodosInColumn,
  };
}

module.exports = { createBoardService };
