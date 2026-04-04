/**
 * Domain shapes shared by HTTP, repositories, and (later) Mongoose.
 * MongoDB mapping notes:
 * - Prefer a single `boards` document `{ _id, columns[], todos[] }` for this app’s scope,
 *   or separate `columns` / `todos` collections with `boardId` + indexes on `(boardId, columnId)`.
 * - Replace numeric `id` with ObjectId in DB if you want; keep mapping in the repository layer.
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {number} id
 * @property {string} text
 * @property {boolean} done
 */

/**
 * @typedef {Object} Column
 * @property {number} id
 * @property {string} title
 * @property {number} order
 */

/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} text
 * @property {boolean} done
 * @property {string|null} photo
 * @property {number} columnId
 * @property {number} sortOrder
 * @property {string|null} [dueDate]
 * @property {string} [description]
 * @property {number|null} [label]
 * @property {number|null} [assigneeId]
 * @property {ChecklistItem[]} [checklist]
 */

/**
 * @typedef {Object} Board
 * @property {Column[]} columns
 * @property {Todo[]} todos
 */

module.exports = {};
