const express = require('express');
const {
  readDummyUnsplashBackgrounds,
  searchUnsplashPhotos,
} = require('../services/unsplashService');

function createUnsplashRouter() {
  const router = express.Router();

  router.get('/photos', async (req, res) => {
    const query =
      typeof req.query.query === 'string' ? req.query.query.trim() : '';

    if (!query) {
      res.json({ photos: readDummyUnsplashBackgrounds() });
      return;
    }

    const result = await searchUnsplashPhotos(query);
    if (result.status) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ photos: result.photos });
  });

  return router;
}

module.exports = { createUnsplashRouter };
