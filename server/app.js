const express = require('express');
const fs = require('fs');
const { config } = require('./config/env');
const { createBoardRepository } = require('./repositories');
const { createBoardService } = require('./services/boardService');
const { createBoardRouter } = require('./routes/boardRoutes');
const { createUnsplashRouter } = require('./routes/unsplashRoutes');
const { createAuthService } = require('./services/authService');
const { createAuthRouter } = require('./routes/authRoutes');

function createApp() {
  const repository = createBoardRepository();
  const boardService = createBoardService(repository);
  const authService = createAuthService();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api', createBoardRouter(boardService));
  app.use('/api/unsplash', createUnsplashRouter());

  if (fs.existsSync(config.indexHtml)) {
    app.use(express.static(config.clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(config.indexHtml);
    });
  }

  return app;
}

module.exports = { createApp };
