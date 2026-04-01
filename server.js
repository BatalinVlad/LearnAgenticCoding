require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'todos.json');
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');
const INDEX_HTML = path.join(CLIENT_DIST, 'index.html');

function loadTodos() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTodos(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

let todos = loadTodos();
let nextId =
  todos.length === 0 ? 1 : Math.max(...todos.map((t) => t.id)) + 1;

const app = express();
app.use(express.json());

app.get('/api/todos', (_req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const text = String(req.body.text ?? '').trim();
  const photo = typeof req.body.photo === 'string' ? req.body.photo : null;
  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  const item = { id: nextId++, text, done: false, photo };
  todos.push(item);
  saveTodos(todos);
  res.status(201).json(item);
});

app.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const item = todos.find((t) => t.id === id);
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
  saveTodos(todos);
  res.json(item);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  todos.splice(idx, 1);
  saveTodos(todos);
  res.status(204).end();
});

app.put('/api/todos/reorder', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : null;
  if (!ids || ids.some((id) => !Number.isFinite(id))) {
    res.status(400).json({ error: 'ids array is required' });
    return;
  }
  if (ids.length !== todos.length) {
    res.status(400).json({ error: 'ids length mismatch' });
    return;
  }

  const idSet = new Set(ids);
  if (idSet.size !== todos.length || todos.some((t) => !idSet.has(t.id))) {
    res.status(400).json({ error: 'ids must match existing tasks exactly' });
    return;
  }

  const byId = new Map(todos.map((t) => [t.id, t]));
  todos = ids.map((id) => byId.get(id));
  saveTodos(todos);
  res.json(todos);
});

if (fs.existsSync(INDEX_HTML)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(INDEX_HTML);
  });
}

app.listen(PORT, () => {
  console.log(`API at http://localhost:${PORT}/api/todos`);
  if (fs.existsSync(INDEX_HTML)) {
    console.log(`App UI served from http://localhost:${PORT}`);
  } else {
    console.log('No client build yet — run npm run build, or npm run dev for Vite.');
  }
});
