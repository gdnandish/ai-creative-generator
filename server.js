const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const publicDir = path.join(root, "public");
const savedDir = path.join(root, "saved-designs");
const port = process.env.PORT || 8787;
const openAiApiKey = process.env.OPENAI_API_KEY || "";
let generationMode = openAiApiKey ? "api" : "mock";

fs.mkdirSync(savedDir, { recursive: true });

function send(res, status, body, type = "application/json") {
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 30 * 1024 * 1024) reject(new Error("Too large"));
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function safeName(name) {
  return String(name || "creative.png")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "creative.png";
}

function imageSizeFor(width, height) {
  const ratio = Number(width) / Number(height || 1);
  if (ratio > 1.2) return "1536x1024";
  if (ratio < 0.85) return "1024x1536";
  return "1024x1024";
}

function saveDataUrl(dataUrl, filename) {
  const match = String(dataUrl || "").match(/^data:image\/png;base64,(.+)$/);
  if (!match) throw new Error("Only PNG data URLs are supported");
  const file = safeName(filename.endsWith(".png") ? filename : `${filename}.png`);
  const target = path.join(savedDir, file);
  fs.writeFileSync(target, Buffer.from(match[1], "base64"));
  return target;
}

function buildOpenAiPrompt(body, index) {
  const imageContext = [
    body.productDataUrl ? "The user uploaded a product image; create a clear hero product placement inspired by it." : "No product image was uploaded.",
    body.referenceDataUrls?.length ? `${body.referenceDataUrls.length} reference image(s) were uploaded; use the brief to follow their layout, mood, hierarchy, and spacing.` : "No reference images were uploaded."
  ].join(" ");

  return [
    body.prompt,
    "",
    imageContext,
    "",
    `Create option ${index}. Make this option visually distinct while staying within the same brief.`,
    "Create a finished digital ad creative. Keep all text readable and spelled correctly. Do not include watermarks, mockup frames, app UI, or extra unrelated text."
  ].join("\n");
}

async function callOpenAiImage(prompt, width, height) {
  if (!openAiApiKey) throw new Error("OPENAI_API_KEY is not configured on the server");

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: imageSizeFor(width, height),
        quality: "medium",
        n: 1
      })
    });
  } catch {
    throw new Error("Could not reach OpenAI from this server");
  }

  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "OpenAI image generation failed");
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI did not return image data");
  return `data:image/png;base64,${b64}`;
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
  const target = path.join(publicDir, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  if (!target.startsWith(publicDir)) {
    send(res, 403, "Forbidden", "text/plain");
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      send(res, 404, "Not found", "text/plain");
      return;
    }
    const type = target.endsWith(".html") ? "text/html" : target.endsWith(".css") ? "text/css" : target.endsWith(".js") ? "text/javascript" : "application/octet-stream";
    send(res, 200, data, type);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, "");

  if (req.method === "GET" && req.url.startsWith("/api/status")) {
    return send(res, 200, JSON.stringify({
      ok: true,
      apiConnected: Boolean(openAiApiKey),
      mode: generationMode,
      hasSavedKey: Boolean(openAiApiKey)
    }));
  }

  if (req.method === "POST" && req.url === "/api/set-key") {
    return send(res, 400, JSON.stringify({
      ok: false,
      error: "For the deployed app, set OPENAI_API_KEY in your hosting environment variables. Do not paste keys in the browser."
    }));
  }

  if (req.method === "POST" && req.url === "/api/clear-key") {
    generationMode = "mock";
    return send(res, 200, JSON.stringify({ ok: true, apiConnected: Boolean(openAiApiKey), mode: generationMode, hasSavedKey: Boolean(openAiApiKey) }));
  }

  if (req.method === "POST" && req.url === "/api/set-mode") {
    try {
      const body = await readJson(req);
      const nextMode = body.mode === "api" ? "api" : "mock";
      if (nextMode === "api" && !openAiApiKey) throw new Error("OPENAI_API_KEY is not configured on the server");
      generationMode = nextMode;
      return send(res, 200, JSON.stringify({ ok: true, mode: generationMode, apiConnected: Boolean(openAiApiKey), hasSavedKey: Boolean(openAiApiKey) }));
    } catch (error) {
      return send(res, 400, JSON.stringify({ ok: false, error: error.message }));
    }
  }

  if (req.method === "POST" && req.url === "/api/test-openai") {
    try {
      if (!openAiApiKey) throw new Error("OPENAI_API_KEY is not configured on the server");
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${openAiApiKey}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "OpenAI API test failed");
      return send(res, 200, JSON.stringify({ ok: true }));
    } catch (error) {
      return send(res, 400, JSON.stringify({ ok: false, error: error.message }));
    }
  }

  if (req.method === "POST" && req.url === "/api/generate-ai") {
    try {
      if (generationMode !== "api") throw new Error("App is in mock mode");
      const body = await readJson(req);
      const optionCount = Math.max(1, Math.min(Number(body.optionCount) || 1, 4));
      const images = [];
      for (let index = 1; index <= optionCount; index++) {
        images.push(await callOpenAiImage(buildOpenAiPrompt(body, index), body.width, body.height));
      }
      return send(res, 200, JSON.stringify({ ok: true, images }));
    } catch (error) {
      return send(res, 400, JSON.stringify({ ok: false, error: error.message }));
    }
  }

  if (req.method === "POST" && req.url === "/api/save-image") {
    try {
      const body = await readJson(req);
      const target = saveDataUrl(body.imageUrl, body.filename);
      return send(res, 200, JSON.stringify({ ok: true, path: target }));
    } catch (error) {
      return send(res, 400, JSON.stringify({ ok: false, error: error.message }));
    }
  }

  if (req.method === "GET") return serveStatic(req, res);
  send(res, 404, "Not found", "text/plain");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`AI Creative Generator running on port ${port}`);
});
