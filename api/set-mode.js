const { hasApiKey, send } = require("./_utils");

module.exports = function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });

  const nextMode = req.body?.mode === "api" ? "api" : "mock";
  if (nextMode === "api" && !hasApiKey()) {
    return send(res, 400, { ok: false, error: "OPENAI_API_KEY is not configured in Vercel environment variables" });
  }

  send(res, 200, {
    ok: true,
    mode: nextMode,
    apiConnected: hasApiKey(),
    hasSavedKey: hasApiKey()
  });
};
