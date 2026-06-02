# AI Creative Generator Deployment

This folder is the permanent Chrome-ready version of the app.

## Why this fixes the Codex issue

The Codex local backend cannot reach OpenAI because network access is blocked in the current Codex environment.

This deployed version runs the backend on a normal hosting service with internet access.

Flow:

```text
Chrome -> deployed app/backend -> OpenAI API
```

## Recommended host

Use Render for the first deployment because this is a normal Node server.

## Render setup

1. Create a new GitHub repository and upload this folder.
2. In Render, create a new Web Service.
3. Select the repository.
4. Use these settings:

```text
Build command: npm install
Start command: npm start
```

5. Add this environment variable in Render:

```text
OPENAI_API_KEY=your_openai_api_key
```

6. Deploy.
7. Open the Render URL in Chrome.
8. Click API mode, then Test API.

## Local Chrome test

If your own terminal has internet access and Node.js installed:

```bash
cd outputs/deploy-ai-creative-generator
set OPENAI_API_KEY=your_openai_api_key
npm start
```

Then open:

```text
http://127.0.0.1:8787
```

## Important

Do not paste your API key into frontend code.
Do not upload `.env` files to GitHub.
Set `OPENAI_API_KEY` only in the hosting dashboard.

