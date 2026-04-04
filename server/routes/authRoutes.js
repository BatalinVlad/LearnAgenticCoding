const express = require('express')

/**
 * @param {ReturnType<import('../services/authService')['createAuthService']>} authService
 */
function createAuthRouter(authService) {
  const router = express.Router()

  function bearerToken(req) {
    const raw = req.headers.authorization
    if (!raw || typeof raw !== 'string') return null
    const m = raw.match(/^Bearer\s+(\S+)$/i)
    return m ? m[1] : null
  }

  router.get('/members', (_req, res) => {
    res.json({ members: authService.listPublicMembers() })
  })

  router.get('/me', (req, res) => {
    const token = bearerToken(req)
    if (!token) {
      res.json({ user: null })
      return
    }
    const user = authService.getMeByToken(token)
    if (!user) {
      res.status(401).json({ error: 'Session expired or invalid.' })
      return
    }
    res.json({ user })
  })

  router.post('/login', (req, res) => {
    const username = typeof req.body.username === 'string' ? req.body.username : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const result = authService.login(username, password)
    if (result.error) {
      res.status(result.status || 400).json({ error: result.error })
      return
    }
    res.json({ user: result.user, token: result.token })
  })

  router.post('/register', (req, res) => {
    const result = authService.register({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    })
    if (result.error) {
      res.status(result.status || 400).json({ error: result.error })
      return
    }
    res.status(201).json({ user: result.user, token: result.token })
  })

  router.post('/logout', (req, res) => {
    const token = bearerToken(req)
    if (token) authService.logout(token)
    res.status(204).end()
  })

  return router
}

module.exports = { createAuthRouter }
