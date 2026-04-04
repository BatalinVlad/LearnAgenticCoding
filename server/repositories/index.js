const { config } = require('../config/env');
const { createFileBoardRepository } = require('./fileBoardRepository');
const { createMemoryBoardRepository } = require('./memoryBoardRepository');
const { createMongoBoardRepository } = require('./mongoBoardRepository');

/**
 * @returns {{ load: () => import('../models/board').Board; save: (b: import('../models/board').Board) => void }}
 */
function createBoardRepository() {
  const store = config.boardStore;
  if (store === 'mongo') {
    return createMongoBoardRepository();
  }
  if (store === 'memory') {
    return createMemoryBoardRepository();
  }
  return createFileBoardRepository({ dataFile: config.dataFile });
}

module.exports = { createBoardRepository };
