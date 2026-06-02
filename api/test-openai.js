const { send } = require("./_utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { ok: false, error: "Method not allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured in Vercel environment variables");
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || "OpenAI API test failed");
    send(res, 200, { ok: true });
  } catch (error) {
    send(res, 400, { ok: false, error: error.message });
  }
};
