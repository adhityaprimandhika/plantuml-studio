# PlantUML Studio

A small web app that:

- **Previews** PlantUML diagrams live as you type
- **Summarizes the logic** of a diagram in plain language (via Ollama)
- **Summarizes by color** — groups elements that share a PlantUML color annotation (e.g. `#Orange`) and explains what each group represents
- **Generates boilerplate code** in a language of your choice, matching the diagram's structure

Stack: React (Vite) frontend, Node/Express backend, a self-hosted PlantUML render server, and your local Ollama instance for all AI features. Nothing is sent to any third-party AI API — only to whatever Ollama endpoint you configure.

## Project layout

```
plantuml-studio/
├── backend/            Express API + serves built frontend in production
│   ├── routes/         render.js (PlantUML proxy), analyze.js (Ollama-backed)
│   └── services/       ollamaService.js, colorParser.js
├── frontend/           React app (Vite)
├── Dockerfile          Multi-stage build: builds frontend, bundles into backend
└── docker-compose.yml  app + plantuml-server
```

## How the color summarization works

PlantUML doesn't have a single canonical "color" concept — colors show up as `#RRGGBB` or `#ColorName` attached to classes, participants, states, arrows, etc. `backend/services/colorParser.js` scans the source line by line, extracts color tokens, and groups the matching lines by color. Each group's lines are sent to Ollama with a prompt asking it to explain what that colored group represents. This is heuristic, not a full PlantUML grammar parser — it covers the common inline-color patterns but won't understand colors set only via complex `skinparam` blocks.

## Local development

Requires Node 20+, and either Docker (for the PlantUML render server) or a local PlantUML install.

```bash
# Terminal 1: PlantUML render server
docker run -d -p 8090:8090 plantuml/plantuml-server:jetty

# Terminal 2: backend
cd backend
cp .env.example .env   # edit OLLAMA_BASE_URL / OLLAMA_MODEL if needed
npm install
npm run dev             # http://localhost:5000

# Terminal 3: frontend (dev server with hot reload, proxies /api to :5000)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Make sure Ollama is running and you've pulled a model:

```bash
ollama pull llama3
ollama pull qwen2.5-coder   # optional, used for the boilerplate tab if set
```

## Deploying to your VPS

This ships as a single Docker Compose stack: the app container (frontend + backend combined) plus a PlantUML render container. Ollama is assumed to already be running on the VPS itself (as you mentioned it's set up).

1. Copy this whole `plantuml-studio/` folder to your VPS.
2. On the VPS, confirm Ollama is listening and reachable:
   ```bash
   curl http://127.0.0.1:11434/api/tags
   ```
   If you want the app container to reach Ollama on the host, the compose file already adds `host.docker.internal` mapped to the host gateway (works on modern Docker/Linux). If that doesn't resolve for your setup, simplest fix: run Ollama with `OLLAMA_HOST=0.0.0.0:11434` and set `OLLAMA_BASE_URL` in `docker-compose.yml` to `http://<vps-private-ip>:11434`.
3. Build and start:
   ```bash
   cd plantuml-studio
   OLLAMA_MODEL=llama3 OLLAMA_CODE_MODEL=qwen2.5-coder docker compose up -d --build
   ```
4. The app is now listening on port `5000` on the VPS. Put a reverse proxy in front of it for TLS + your domain, e.g. Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   Then run `certbot --nginx -d your-domain.com` for HTTPS.
5. Logs / redeploy:
   ```bash
   docker compose logs -f app
   docker compose up -d --build   # after pulling new code
   ```

### Security note

This app has no authentication layer. If you're exposing it on the public internet, put it behind at least basic auth (e.g. an `auth_basic` block in Nginx) or a VPN, since anyone who can reach it can run prompts against your Ollama instance.

## Extending it

- **Different diagram types**: the summarizer and boilerplate prompts already work generically across sequence/class/state/component diagrams since they just read the raw PlantUML text — no changes needed.
- **Streaming responses**: `ollamaService.generate` currently calls Ollama non-streaming (`stream: false`) for simplicity. For long boilerplate generations, switching to Ollama's streaming mode and forwarding chunks over SSE/WebSocket to the frontend would make it feel faster.
- **Better color parsing**: extend `colorParser.js` if you rely heavily on `skinparam` stereotype coloring rather than inline `#color` tags.
