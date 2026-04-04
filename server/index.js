const path = require('path');
// Load .env from project root (parent of server/), not from cwd.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(ROOT, 'todos.json');
const CLIENT_DIST = path.join(ROOT, 'client', 'dist');
const INDEX_HTML = path.join(CLIENT_DIST, 'index.html');
const DUMMY_UNSPLASH_PATH = path.join(
  ROOT,
  'client',
  'src',
  'data',
  'dummyUnsplashBackgrounds.json',
);

function readDummyUnsplashBackgrounds() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DUMMY_UNSPLASH_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeBoard(raw) {
  if (Array.isArray(raw)) {
    const todos = raw.map((t, i) => ({
      ...t,
      columnId: 1,
      sortOrder: i,
      description:
        typeof t.description === 'string' ? t.description : '',
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
          description:
            typeof t.description === 'string' ? t.description : '',
          dueDate: normalizeDueDateField(t.dueDate),
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
// Default 100kb is too small for base64 photo payloads (client allows up to 700KB files).
app.use(express.json({ limit: '2mb' }));

function firstUrlFromSizes(urls, keys) {
  if (!urls || typeof urls !== 'object') return undefined;
  for (const k of keys) {
    const v = urls[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function unsplashErrorMessage(status, bodyText) {
  let parsed = null;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    /* use text */
  }
  if (parsed && Array.isArray(parsed.errors) && parsed.errors.length) {
    return parsed.errors.join(' ');
  }
  if (parsed && typeof parsed.error === 'string') {
    return parsed.error;
  }
  if (status === 401) {
    return 'Unsplash rejected the access key. Use the Access Key from unsplash.com/developers (not the Secret), in project-root .env as UNSPLASH_ACCESS_KEY.';
  }
  if (status === 403) {
    return 'Unsplash rate limit or access denied. Wait or check your app status on unsplash.com/developers.';
  }
  const snippet = String(bodyText || '').trim().slice(0, 180);
  return snippet || `Unsplash returned HTTP ${status}.`;
}

const UNSPLASH_PHOTO_FIELDS = [
  'regular',
  'full',
  'raw',
  'small',
  'thumb',
];

function mapUnsplashApiPhotoToClient(p) {
  if (!p || !p.urls) return null;
  const u = p.urls;
  const fullUrl = firstUrlFromSizes(u, UNSPLASH_PHOTO_FIELDS);
  const thumbUrl =
    firstUrlFromSizes(u, ['thumb', 'small', 'regular', 'full', 'raw']) ||
    fullUrl;
  if (!p.id || !fullUrl) return null;
  return {
    id: p.id,
    fullUrl,
    thumbUrl,
    photographerName: p.user?.name || 'Photographer',
    photographerUrl: p.user?.links?.html || 'https://unsplash.com',
    photoPageUrl: typeof p.links?.html === 'string' ? p.links.html : undefined,
  };
}

app.get('/api/unsplash/photos', async (req, res) => {
  const query =
    typeof req.query.query === 'string' ? req.query.query.trim() : '';

  if (!query) {
    res.json({ photos: readDummyUnsplashBackgrounds() });
    return;
  }

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !String(key).trim()) {
    res.status(503).json({
      error:
        'Unsplash is not configured. In the project root, create .env with UNSPLASH_ACCESS_KEY=your_access_key (see .env.example). Restart the API after saving.',
    });
    return;
  }
  try {
    const params = new URLSearchParams({
      query,
      per_page: '12',
      orientation: 'landscape',
      client_id: String(key).trim(),
    });
    const url = `https://api.unsplash.com/search/photos?${params.toString()}`;
    const r = await fetch(url);
    const bodyText = await r.text();
    if (!r.ok) {
      const msg = unsplashErrorMessage(r.status, bodyText);
      console.error('Unsplash error', r.status, bodyText);
      res.status(502).json({
        error: `Unsplash request failed: ${msg}`,
      });
      return;
    }
    const data = JSON.parse(bodyText);
    const list = Array.isArray(data.results) ? data.results : [];
    const photos = list.map(mapUnsplashApiPhotoToClient).filter(Boolean);
    res.json({ photos });
  } catch (e) {
    console.error(e);
    res.status(502).json({
      error:
        'Could not load photos from Unsplash (network error or invalid response).',
    });
  }
});

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
    dueDate: normalizeDueDateField(req.body.dueDate),
    checklist: [],
  };
  board.todos.push(item);
  saveBoard(board);
  res.status(201).json(item);
});

app.post('/api/todos/:id/duplicate', (req, res) => {
  const id = Number(req.params.id);
  const source = board.todos.find((t) => t.id === id);
  if (!source) {
    res.status(404).json({ error: 'not found' });
    return;
  }
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
    checklist,
  };
  board.todos.push(duplicate);
  board.todos = sortTodos(board.todos);
  saveBoard(board);
  res.status(201).json(duplicate);
});

app.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = board.todos.find((t) => t.id === id);
  if (!item) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  if (typeof req.body.text === 'string') {
    const next = String(req.body.text).trim();
    if (next) {
      item.text = next;
    }
  }
  if (req.body.photo === null || typeof req.body.photo === 'string') {
    item.photo = req.body.photo;
  }
  if (typeof req.body.description === 'string') {
    item.description = req.body.description;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate')) {
    item.dueDate = normalizeDueDateField(req.body.dueDate);
  }
  saveBoard(board);
  res.json(item);
});

app.post('/api/todos/:id/checklist', (req, res) => {
  const id = Number(req.params.id);
  const item = board.todos.find((t) => t.id === id);
  if (!item) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const text = String(req.body.text ?? '').trim();
  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  if (!Array.isArray(item.checklist)) {
    item.checklist = [];
  }
  const sub = { id: nextChecklistItemId++, text, done: false };
  item.checklist.push(sub);
  saveBoard(board);
  res.status(201).json(sub);
});

app.patch('/api/todos/:id/checklist/:itemId', (req, res) => {
  const id = Number(req.params.id);
  const checklistItemId = Number(req.params.itemId);
  const item = board.todos.find((t) => t.id === id);
  if (!item || !Array.isArray(item.checklist)) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const sub = item.checklist.find((c) => c.id === checklistItemId);
  if (!sub) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  if (typeof req.body.done === 'boolean') {
    sub.done = req.body.done;
  }
  if (typeof req.body.text === 'string') {
    const next = String(req.body.text).trim();
    if (next) {
      sub.text = next;
    }
  }
  saveBoard(board);
  res.json(sub);
});

app.delete('/api/todos/:id/checklist/:itemId', (req, res) => {
  const id = Number(req.params.id);
  const checklistItemId = Number(req.params.itemId);
  const item = board.todos.find((t) => t.id === id);
  if (!item || !Array.isArray(item.checklist)) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const idx = item.checklist.findIndex((c) => c.id === checklistItemId);
  if (idx === -1) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  item.checklist.splice(idx, 1);
  saveBoard(board);
  res.status(204).end();
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
