const { buildOpenAiPrompt, callOpenAiImage, send } = require("./_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const body = req.body || {};
    const optionCount = Math.max(1, Math.min(Number(body.optionCount) || 1, 4));
    const images = [];

    for (let index = 1; index <= optionCount; index++) {
      images.push(await callOpenAiImage(buildOpenAiPrompt(body, index), body.width, body.height));
    }

    send(res, 200, { ok: true, images });
  } catch (error) {
    send(res, 400, { ok: false, error: error.message });
  }
};
