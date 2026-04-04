/**
 * Demo users — passwords are only for client-side checks until a real auth API exists.
 * Replace `login` in AuthContext with an API call that returns a session / user profile.
 */

export const BOARD_MEMBERS = [
  {
    id: 1,
    username: 'vbatalin',
    name: 'Vlad Batalin',
    initials: 'VB',
    password: 'password',
    tasks: ['task-1', 'task-2'],
  },
  {
    id: 2,
    username: 'johndoe',
    name: 'John Doe',
    initials: 'JD',
    password: 'password',
    tasks: ['task-3'],
  },
  {
    id: 3,
    username: 'sarahsmith',
    name: 'Sarah Smith',
    initials: 'SS',
    password: 'password',
    tasks: [],
  },
]

/** @param {typeof BOARD_MEMBERS[number]} member */
export function toPublicUser(member) {
  return {
    id: member.id,
    username: member.username,
    name: member.name,
    initials: member.initials,
    tasks: member.tasks,
  }
}

export function findMemberByCredentials(username, password) {
  const u = username.trim().toLowerCase()
  return BOARD_MEMBERS.find(
    (m) => m.username.toLowerCase() === u && m.password === password,
  )
}

export function findMemberById(id) {
  return BOARD_MEMBERS.find((m) => m.id === id) ?? null
}
