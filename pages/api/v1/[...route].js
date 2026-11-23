import app from '@/server/app';

export default function handler(req, res) {
  // Reconstruct the full path: /api/v1/... from the catch-all route parameter
  // Next.js catch-all gives us req.query.route = ['health', 'users', etc.]
  const routeParts = req.query.route || [];
  req.url = `/api/v1/${routeParts.join('/')}`;
  
  // Preserve query string if present and strip Next.js catch-all `route` param
  const queryString = new URL(req.url, 'http://localhost').search;
  if (Object.keys(req.query).length > 1 || queryString) {
    const params = new URLSearchParams();
    Object.keys(req.query).forEach(key => {
      if (key !== 'route') params.append(key, req.query[key]);
    });
    if (params.toString()) {
      req.url += '?' + params.toString();
    }
  }
  delete req.query.route;
  
  return app(req, res);
}

// Disable Next.js default body parser to let Express handle it
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
