const fs = require('fs');
const { config } = require('../config/env');

function readDummyUnsplashBackgrounds() {
  try {
    const parsed = JSON.parse(
      fs.readFileSync(config.dummyUnsplashPath, 'utf8'),
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function firstUrlFromSizes(urls, keys) {
  if (!urls || typeof urls !== 'object') return undefined;
  for (const k of keys) {
    const v = urls[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function unsplashErrorMessage(status, bodyText) {
  let parsed = null;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    /* use text */
  }
  if (parsed && Array.isArray(parsed.errors) && parsed.errors.length) {
    return parsed.errors.join(' ');
  }
  if (parsed && typeof parsed.error === 'string') {
    return parsed.error;
  }
  if (status === 401) {
    return 'Unsplash rejected the access key. Use the Access Key from unsplash.com/developers (not the Secret), in project-root .env as UNSPLASH_ACCESS_KEY.';
  }
  if (status === 403) {
    return 'Unsplash rate limit or access denied. Wait or check your app status on unsplash.com/developers.';
  }
  const snippet = String(bodyText || '').trim().slice(0, 180);
  return snippet || `Unsplash returned HTTP ${status}.`;
}

const UNSPLASH_PHOTO_FIELDS = ['regular', 'full', 'raw', 'small', 'thumb'];

function mapUnsplashApiPhotoToClient(p) {
  if (!p || !p.urls) return null;
  const u = p.urls;
  const fullUrl = firstUrlFromSizes(u, UNSPLASH_PHOTO_FIELDS);
  const thumbUrl =
    firstUrlFromSizes(u, ['thumb', 'small', 'regular', 'full', 'raw']) ||
    fullUrl;
  if (!p.id || !fullUrl) return null;
  return {
    id: p.id,
    fullUrl,
    thumbUrl,
    photographerName: p.user?.name || 'Photographer',
    photographerUrl: p.user?.links?.html || 'https://unsplash.com',
    photoPageUrl: typeof p.links?.html === 'string' ? p.links.html : undefined,
  };
}

/**
 * @param {string} query
 */
async function searchUnsplashPhotos(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !String(key).trim()) {
    return {
      error:
        'Unsplash is not configured. In the project root, create .env with UNSPLASH_ACCESS_KEY=your_access_key (see .env.example). Restart the API after saving.',
      status: 503,
    };
  }
  try {
    const params = new URLSearchParams({
      query,
      per_page: '12',
      orientation: 'landscape',
      client_id: String(key).trim(),
    });
    const url = `https://api.unsplash.com/search/photos?${params.toString()}`;
    const r = await fetch(url);
    const bodyText = await r.text();
    if (!r.ok) {
      const msg = unsplashErrorMessage(r.status, bodyText);
      console.error('Unsplash error', r.status, bodyText);
      return {
        error: `Unsplash request failed: ${msg}`,
        status: 502,
      };
    }
    const data = JSON.parse(bodyText);
    const list = Array.isArray(data.results) ? data.results : [];
    const photos = list.map(mapUnsplashApiPhotoToClient).filter(Boolean);
    return { photos };
  } catch (e) {
    console.error(e);
    return {
      error:
        'Could not load photos from Unsplash (network error or invalid response).',
      status: 502,
    };
  }
}

module.exports = {
  readDummyUnsplashBackgrounds,
  searchUnsplashPhotos,
};
