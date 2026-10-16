# Orbit Studio

A polished, provider-agnostic AI workspace starter for GitHub + Railway. It includes a chat/image/video control-room UI, provider/model selection, a server-side API boundary, and a demo mode that works before keys are added.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Railway

1. Push this folder to GitHub.
2. Create a Railway service from the repo.
3. Add variables from `.env.example` in Railway Variables.
4. Deploy. Railway will use `railway.json` and serve the built app.

This project does **not** bypass provider limits or make paid models universally free. Free tiers and open models vary by provider, and image/video adapters should be added server-side with the provider's terms and keys.
