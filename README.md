# AI Creative Generator Vercel Deployment

This folder is the permanent Chrome-ready Vercel version of the app.

## Why this fixes the Codex issue

The Codex local backend cannot reach OpenAI because network access is blocked in the current Codex environment.

This deployed version runs OpenAI calls in Vercel serverless API routes.

Flow:

```text
Chrome -> Vercel frontend -> Vercel /api route -> OpenAI API
```

## Project structure

```text
public/index.html
api/status.js
api/generate-ai.js
api/test-openai.js
api/set-mode.js
api/set-key.js
api/clear-key.js
api/save-image.js
package.json
vercel.json
```

## Vercel settings

Use these exact settings when importing from GitHub:

```text
Framework Preset: Other
Install Command: npm install
Build Command: npm run build
Output Directory: public
```

Add this environment variable in Vercel:

```text
OPENAI_API_KEY=your_openai_api_key
```

## Deploy from GitHub

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Go to Vercel.
4. Click Add New Project.
5. Import the GitHub repository.
6. Use the Vercel settings above.
7. Add `OPENAI_API_KEY`.
8. Deploy.
9. Open the Vercel URL in Chrome.
10. Click API mode, then Test API.

## Local Vercel test

If you install the Vercel CLI, you can test locally with:

```bash
vercel dev
```

## Important

Do not paste your API key into frontend code.
Do not upload `.env` files to GitHub.
Set `OPENAI_API_KEY` only in Vercel Project Settings > Environment Variables.
