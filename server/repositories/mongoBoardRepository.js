/**
 * Placeholder for a MongoDB-backed board store.
 *
 * When you add `mongoose` (or the native driver), implement:
 * - connect using `config.mongoUri` from `../config/env.js`
 * - load/save one document per board, or use separate collections with indexes
 * - map `_id` ↔ numeric `id` in the repository if the client keeps numeric ids
 *
 * @returns {never}
 */
function createMongoBoardRepository() {
  throw new Error(
    'MongoDB board store is not implemented yet. Install mongoose, set MONGODB_URI, ' +
      'implement createMongoBoardRepository in server/repositories/mongoBoardRepository.js, ' +
      'then set BOARD_STORE=mongo.',
  );
}

module.exports = { createMongoBoardRepository };
