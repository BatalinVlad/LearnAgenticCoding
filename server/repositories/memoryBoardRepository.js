const { normalizeBoard } = require('../utils/boardNormalize');

/**
 * In-memory board (optional seed). Useful for tests and ephemeral demos.
 * @param {{ seed?: unknown }} [options]
 */
function createMemoryBoardRepository(options = {}) {
  let board = normalizeBoard(options.seed ?? { columns: [], todos: [] });

  function load() {
    return board;
  }

  /** @param {import('../models/board').Board} next */
  function save(next) {
    board = next;
  }

  return { load, save };
}

module.exports = { createMemoryBoardRepository };
