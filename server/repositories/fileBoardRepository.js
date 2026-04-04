const fs = require('fs');
const { normalizeBoard } = require('../utils/boardNormalize');

/**
 * Persists the whole board to `todos.json`. Swap for MongoBoardRepository later; keep the same contract.
 * @param {{ dataFile: string }} options
 */
function createFileBoardRepository(options) {
  const { dataFile } = options;

  /**
   * @returns {import('../models/board').Board}
   */
  function load() {
    try {
      const raw = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      if (Array.isArray(raw)) {
        const normalized = normalizeBoard(raw);
        save(normalized);
        return normalized;
      }
      return normalizeBoard(raw);
    } catch {
      return { columns: [{ id: 1, title: 'TO DO', order: 0 }], todos: [] };
    }
  }

  /**
   * @param {import('../models/board').Board} board
   */
  function save(board) {
    fs.writeFileSync(dataFile, JSON.stringify(board, null, 2));
  }

  return { load, save };
}

module.exports = { createFileBoardRepository };
