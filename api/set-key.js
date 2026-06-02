const { send } = require("./_utils");

module.exports = function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });
  send(res, 400, {
    ok: false,
    error: "For Vercel, add OPENAI_API_KEY in Project Settings > Environment Variables. Do not paste API keys in the browser."
  });
};
