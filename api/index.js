import serverModule from "../dist/server.cjs";
const app = serverModule.default || serverModule;

export default function handler(req, res) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
}

