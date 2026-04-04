const express = require('express');

/**
 * @param {ReturnType<import('../services/boardService')['createBoardService']>} boardService
 */
function createBoardRouter(boardService) {
  const router = express.Router();

  router.get('/board', (_req, res) => {
    res.json(boardService.getBoard());
  });

  router.post('/columns', (req, res) => {
    const col = boardService.createColumn(req.body);
    res.status(201).json(col);
  });

  router.put('/columns/reorder', (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : null;
    const snapshot = boardService.getBoard();
    if (!ids || ids.length !== snapshot.columns.length) {
      res.status(400).json({ error: 'ids must list every column once' });
      return;
    }
    const idSet = new Set(ids);
    if (
      idSet.size !== ids.length ||
      snapshot.columns.some((c) => !idSet.has(c.id))
    ) {
      res.status(400).json({ error: 'invalid ids' });
      return;
    }
    const columns = boardService.reorderColumns(ids);
    res.json(columns);
  });

  router.patch('/columns/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = boardService.patchColumn(id, req.body);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (result.error === 'title_required') {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    res.json(result.column);
  });

  router.delete('/columns/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = boardService.deleteColumn(id);
    if (result.error === 'last_column') {
      res.status(400).json({ error: 'cannot delete the last column' });
      return;
    }
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(result.board);
  });

  router.put('/todos/move', (req, res) => {
    const result = boardService.moveTodo(req.body);
    if (result.error === 'bad_request') {
      res.status(400).json({ error: 'id, toColumnId, and toIndex are required' });
      return;
    }
    if (result.error === 'invalid_column') {
      res.status(400).json({ error: 'invalid column' });
      return;
    }
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (result.error === 'bad_state') {
      res.status(400).json({ error: 'bad state' });
      return;
    }
    res.json(result.todos);
  });

  router.post('/todos', (req, res) => {
    const result = boardService.createTodo(req.body);
    if (result.error === 'text_required') {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    if (result.error === 'column_required') {
      res.status(400).json({ error: 'valid columnId is required' });
      return;
    }
    res.status(201).json(result.todo);
  });

  router.post('/todos/:id/duplicate', (req, res) => {
    const id = Number(req.params.id);
    const result = boardService.duplicateTodo(id);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(201).json(result.todo);
  });

  router.patch('/todos/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = boardService.patchTodo(id, req.body);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(result.todo);
  });

  router.post('/todos/:id/checklist', (req, res) => {
    const id = Number(req.params.id);
    const result = boardService.addChecklistItem(id, req.body);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (result.error === 'text_required') {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    res.status(201).json(result.item);
  });

  router.patch('/todos/:id/checklist/:itemId', (req, res) => {
    const id = Number(req.params.id);
    const checklistItemId = Number(req.params.itemId);
    const result = boardService.patchChecklistItem(id, checklistItemId, req.body);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.json(result.item);
  });

  router.delete('/todos/:id/checklist/:itemId', (req, res) => {
    const id = Number(req.params.id);
    const checklistItemId = Number(req.params.itemId);
    const result = boardService.deleteChecklistItem(id, checklistItemId);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).end();
  });

  router.delete('/todos/:id', (req, res) => {
    const id = Number(req.params.id);
    const result = boardService.deleteTodo(id);
    if (result.error === 'not_found') {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).end();
  });

  router.put('/todos/reorder', (req, res) => {
    const result = boardService.reorderTodosInColumn(req.body);
    if (result.error === 'bad_request') {
      res.status(400).json({ error: 'columnId and ids array are required' });
      return;
    }
    if (result.error === 'length_mismatch') {
      res.status(400).json({ error: 'ids length mismatch for column' });
      return;
    }
    if (result.error === 'ids_mismatch') {
      res.status(400).json({ error: 'ids must match tasks in column' });
      return;
    }
    res.json(result.todos);
  });

  return router;
}

module.exports = { createBoardRouter };
