# Wormie Web

Frontend service for Wormie. This repo is designed to stand on its own and deploy separately from the API.

## Local setup

1. Run `npm install`
2. Start the app with `npm run dev`
3. Open [http://127.0.0.1:5173](http://127.0.0.1:5173)

For local development, leave `VITE_API_BASE_URL` unset and let Vite proxy `/api` and `/media` to `http://127.0.0.1:8000`.

## Docker

```bash
docker build -t wormie-web .
docker run --rm -p 8080:8080 -e API_BASE_URL=https://your-api-service-url wormie-web
```

## Cloud Run

Deploy this repo as its own Cloud Run service:

```powershell
.\scripts\deploy-cloud-run.ps1 -ProjectId wormie-ingenuity -Account bob.bbvillarin@gmail.com -ApiBaseUrl "https://your-api-service-url"
```
