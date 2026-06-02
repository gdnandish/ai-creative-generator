function send(res, status, body) {
  res.status(status).json(body);
}

function hasApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function imageSizeFor(width, height) {
  const ratio = Number(width) / Number(height || 1);
  if (ratio > 1.2) return "1536x1024";
  if (ratio < 0.85) return "1024x1536";
  return "1024x1024";
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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in Vercel environment variables");
  }

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
    throw new Error("Could not reach OpenAI from Vercel");
  }

  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "OpenAI image generation failed");

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI did not return image data");
  return `data:image/png;base64,${b64}`;
}

module.exports = {
  buildOpenAiPrompt,
  callOpenAiImage,
  hasApiKey,
  send
};
