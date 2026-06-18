const app = require("../artifacts/api-server/dist/app.cjs");

const config = {
  maxDuration: 60,
};

function handler(req, res) {
  // If Vercel rewrote the request to /api/server?path=..., restore the original URL path
  // so Express's router can match it correctly.
  const queryPath = req.query?.path || (req.url?.match(/[?&]path=([^&]+)/)?.[1]);
  
  if (queryPath) {
    const originalPath = decodeURIComponent(queryPath);
    // Delete the temporary query param so controllers don't see it
    if (req.query) {
      delete req.query.path;
    }
    
    // Parse original query parameters to reconstruct req.url
    const urlParts = req.url.split('?');
    let queryString = '';
    if (urlParts.length > 1) {
      const searchParams = new URLSearchParams(urlParts[1]);
      searchParams.delete('path');
      const searchString = searchParams.toString();
      if (searchString) {
        queryString = '?' + searchString;
      }
    }
    
    req.url = `/api/${originalPath}` + queryString;
  }

  const expressApp = app.default || app;
  return expressApp(req, res);
}

module.exports = handler;
module.exports.config = config;
