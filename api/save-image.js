const { send } = require("./_utils");

module.exports = function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });
  send(res, 400, {
    ok: false,
    error: "Server-side image saving is not supported on Vercel. Use the browser Save final button."
  });
};
