const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Central config. MongoDB URI is read when you add `mongoose` and swap the board repository.
 * @type {{
 *   root: string;
 *   port: number;
 *   dataFile: string;
 *   clientDist: string;
 *   indexHtml: string;
 *   dummyUnsplashPath: string;
 *   boardStore: 'file' | 'memory' | 'mongo';
 *   mongoUri: string | undefined;
 * }}
 */
const config = {
  root: ROOT,
  port: Number(process.env.PORT) || 3000,
  dataFile: path.join(ROOT, 'todos.json'),
  clientDist: path.join(ROOT, 'client', 'dist'),
  indexHtml: path.join(ROOT, 'client', 'dist', 'index.html'),
  dummyUnsplashPath: path.join(
    ROOT,
    'client',
    'src',
    'data',
    'dummyUnsplashBackgrounds.json',
  ),
  /** `file` = todos.json; `memory` = ephemeral; `mongo` = MongoBoardRepository (when implemented). */
  boardStore: String(process.env.BOARD_STORE || 'file').toLowerCase(),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
};

module.exports = { config };
