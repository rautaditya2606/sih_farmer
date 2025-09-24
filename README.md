# AI-powered Farmer Advisory (Node.js + Express + Vanilla JS)

Offline-ready scaffold using JSON files instead of a database. Includes stubs for LLM, translation, transcription, and image classification.

## Features
- `/api/query` accepts text (Malayalam/English), optional image, optional voice note
- Stubs: transcription, translation, LLM, image classifier, weather
- Stores queries in `data/queries.json` and farmers in `data/farmers.json`
- Static frontend with voice recording and image upload

## Setup
1. Install Node.js >= 18
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start dev server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`

## Project Structure
```
server/
  server.js
  controllers/
    queryController.js
    feedbackController.js
  routes/
    index.js
  services/
    stubs.js
  utils/
    storage.js
public/
  index.html
  app.js
  style.css
data/
  queries.json
  farmers.json
.env
```

## API
- `POST /api/query` (multipart/form-data)
  - fields: `text` (string), `voice` (file), `image` (file)
  - returns: `{ answer, confidence, source }`
- `POST /api/feedback` (application/json)
  - body: `{ queryId, helpful }`
  - returns: `{ ok: true }`

## Notes
- All external APIs are stubbed to run offline.
- Swap JSON storage with DB later by replacing `server/utils/storage.js` and services. 