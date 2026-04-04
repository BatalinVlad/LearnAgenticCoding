/**
 * User directory for the board UI comes from the API (`GET /api/auth/members`).
 * Demo seed accounts are defined in `server/data/seedBoardUsers.js`.
 */

/** @param {{ id: number, username: string, name: string, initials: string, color: string, tasks?: string[] }} member */
export function toPublicUser(member) {
  return {
    id: member.id,
    username: member.username,
    name: member.name,
    initials: member.initials,
    color: member.color,
    tasks: member.tasks ?? [],
  }
}
