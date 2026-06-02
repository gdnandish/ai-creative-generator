const { hasApiKey, send } = require("./_utils");

module.exports = function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });
  send(res, 200, {
    ok: true,
    apiConnected: hasApiKey(),
    mode: "mock",
    hasSavedKey: hasApiKey()
  });
};
