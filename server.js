require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');
const INDEX_HTML = path.join(CLIENT_DIST, 'index.html');

function normalizeBoard(raw) {
  if (Array.isArray(raw)) {
    const todos = raw.map((t, i) => ({
      ...t,
      columnId: 1,
      sortOrder: i,
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
      todos: raw.todos.map((t, i) => ({
        ...t,
        columnId: Number(t.columnId) || defaultColId,
        sortOrder: typeof t.sortOrder === 'number' ? t.sortOrder : i,
      })),
    };
  }
  return {
    columns: [{ id: 1, title: 'TO DO', order: 0 }],
    todos: [],
  };
}

function loadBoard() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (Array.isArray(raw)) {
      const normalized = normalizeBoard(raw);
      saveBoard(normalized);
      return normalized;
    }
    return normalizeBoard(raw);
  } catch {
    return { columns: [{ id: 1, title: 'TO DO', order: 0 }], todos: [] };
  }
}

function saveBoard(board) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(board, null, 2));
}

let board = loadBoard();
let nextTodoId =
  board.todos.length === 0
    ? 1
    : Math.max(...board.todos.map((t) => t.id)) + 1;
let nextColumnId =
  board.columns.length === 0
    ? 1
    : Math.max(...board.columns.map((c) => c.id)) + 1;

function sortTodos(list) {
  return [...list].sort((a, b) => {
    if (a.columnId !== b.columnId) return a.columnId - b.columnId;
    return a.sortOrder - b.sortOrder;
  });
}

function sortColumns(cols) {
  return [...cols].sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : a.id;
    const ob = typeof b.order === 'number' ? b.order : b.id;
    if (oa !== ob) return oa - ob;
    return a.id - b.id;
  });
}

function ensureColumnOrders() {
  board.columns = sortColumns(board.columns);
  board.columns.forEach((c, i) => {
    c.order = i;
  });
}

board.todos = sortTodos(board.todos);
ensureColumnOrders();

const app = express();
app.use(express.json());

app.get('/api/board', (_req, res) => {
  res.json({
    columns: sortColumns(board.columns),
    todos: sortTodos(board.todos),
  });
});

app.post('/api/columns', (req, res) => {
  const n = board.columns.length + 1;
  const title =
    typeof req.body.title === 'string' && req.body.title.trim()
      ? req.body.title.trim()
      : `COLUMN ${n}`;
  const order =
    board.columns.length === 0
      ? 0
      : Math.max(...board.columns.map((c) => (typeof c.order === 'number' ? c.order : 0))) + 1;
  const col = { id: nextColumnId++, title, order };
  board.columns.push(col);
  ensureColumnOrders();
  saveBoard(board);
  res.status(201).json(col);
});

app.put('/api/columns/reorder', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : null;
  if (!ids || ids.length !== board.columns.length) {
    res.status(400).json({ error: 'ids must list every column once' });
    return;
  }
  const idSet = new Set(ids);
  if (idSet.size !== ids.length || board.columns.some((c) => !idSet.has(c.id))) {
    res.status(400).json({ error: 'invalid ids' });
    return;
  }
  ids.forEach((id, i) => {
    const c = board.columns.find((x) => x.id === id);
    if (c) c.order = i;
  });
  board.columns = sortColumns(board.columns);
  saveBoard(board);
  res.json(sortColumns(board.columns));
});

app.patch('/api/columns/:id', (req, res) => {
  const id = Number(req.params.id);
  const col = board.columns.find((c) => c.id === id);
  if (!col) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const title = String(req.body.title ?? '').trim();
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  col.title = title;
  saveBoard(board);
  res.json(col);
});

app.delete('/api/columns/:id', (req, res) => {
  const id = Number(req.params.id);
  if (board.columns.length <= 1) {
    res.status(400).json({ error: 'cannot delete the last column' });
    return;
  }
  const idx = board.columns.findIndex((c) => c.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'not found' });
    return;
  }
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
  saveBoard(board);
  res.json({ columns: sortColumns(board.columns), todos: sortTodos(board.todos) });
});

app.put('/api/todos/move', (req, res) => {
  const id = Number(req.body.id);
  const toColumnId = Number(req.body.toColumnId);
  const toIndex = Number(req.body.toIndex);
  if (
    !Number.isFinite(id) ||
    !Number.isFinite(toColumnId) ||
    !Number.isFinite(toIndex) ||
    toIndex < 0
  ) {
    res.status(400).json({ error: 'id, toColumnId, and toIndex are required' });
    return;
  }
  if (!board.columns.some((c) => c.id === toColumnId)) {
    res.status(400).json({ error: 'invalid column' });
    return;
  }
  const t = board.todos.find((x) => x.id === id);
  if (!t) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const fromColumnId = t.columnId;

  if (fromColumnId === toColumnId) {
    const colTodos = board.todos
      .filter((x) => x.columnId === fromColumnId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const fromIdx = colTodos.findIndex((x) => x.id === id);
    if (fromIdx === -1) {
      res.status(400).json({ error: 'bad state' });
      return;
    }
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
  saveBoard(board);
  res.json(board.todos);
});

app.post('/api/todos', (req, res) => {
  const text = String(req.body.text ?? '').trim();
  const photo = typeof req.body.photo === 'string' ? req.body.photo : null;
  const columnId = Number(req.body.columnId);
  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  if (!Number.isFinite(columnId) || !board.columns.some((c) => c.id === columnId)) {
    res.status(400).json({ error: 'valid columnId is required' });
    return;
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
  };
  board.todos.push(item);
  saveBoard(board);
  res.status(201).json(item);
});

app.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = board.todos.find((t) => t.id === id);
  if (!item) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  if (typeof req.body.done === 'boolean') {
    item.done = req.body.done;
  }
  if (req.body.photo === null || typeof req.body.photo === 'string') {
    item.photo = req.body.photo;
  }
  saveBoard(board);
  res.json(item);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = board.todos.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  board.todos.splice(idx, 1);
  saveBoard(board);
  res.status(204).end();
});

app.put('/api/todos/reorder', (req, res) => {
  const columnId = Number(req.body.columnId);
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : null;
  if (!Number.isFinite(columnId) || !ids || ids.some((id) => !Number.isFinite(id))) {
    res.status(400).json({ error: 'columnId and ids array are required' });
    return;
  }

  const columnTodos = board.todos.filter((t) => t.columnId === columnId);
  if (ids.length !== columnTodos.length) {
    res.status(400).json({ error: 'ids length mismatch for column' });
    return;
  }

  const idSet = new Set(ids);
  if (idSet.size !== columnTodos.length || columnTodos.some((t) => !idSet.has(t.id))) {
    res.status(400).json({ error: 'ids must match tasks in column' });
    return;
  }

  ids.forEach((todoId, index) => {
    const t = board.todos.find((x) => x.id === todoId);
    if (t) t.sortOrder = index;
  });
  board.todos = sortTodos(board.todos);
  saveBoard(board);
  res.json(board.todos);
});

if (fs.existsSync(INDEX_HTML)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(INDEX_HTML);
  });
}

app.listen(PORT, () => {
  console.log(`API at http://localhost:${PORT}/api/board`);
  if (fs.existsSync(INDEX_HTML)) {
    console.log(`App UI served from http://localhost:${PORT}`);
  } else {
    console.log('No client build yet — run npm run build, or npm run dev for Vite.');
  }
});
