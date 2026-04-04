# External Integrations

**Analysis Date:** 2026-04-05

## APIs & External Services

**LLM/AI Providers:**
- OpenAI - API key via `OPENAI_API_KEY`, `OPENAI_API_KEYS`
- Anthropic - API key via `ANTHROPIC_API_KEY`, `ANTHROPIC_API_KEYS`
- Google/Gemini - API key via `GEMINI_API_KEY`, `GOOGLE_API_KEY`
- OpenRouter - API key via `OPENROUTER_API_KEY`
- Azure OpenAI (via Microsoft extension)
- Amazon Bedrock (via amazon-bedrock extension)
- Ollama (local models via ollama extension)
- Local LLM via node-llama-cpp

**Search & Web:**
- Brave Search - API key via `BRAVE_API_KEY`
- Perplexity - API key via `PERPLEXITY_API_KEY`
- DuckDuckGo - Via duckduckgo extension
- Tavily - Via tavily extension
- Exa - Via exa extension
- Firecrawl - API key via `FIRECRAWL_API_KEY`
- SearXNG - Via searxng extension

**Messaging Channels:**
- Telegram - Bot token via `TELEGRAM_BOT_TOKEN`
- Discord - Bot token via `DISCORD_BOT_TOKEN`
- Slack - Bot token via `SLACK_BOT_TOKEN`, App token via `SLACK_APP_TOKEN`
- WhatsApp - Via whatsapp extension
- iMessage - Via imessage/bluebubbles extensions
- Matrix - Via matrix extension
- IRC - Via irc extension
- Mattermost - Bot token via `MATTERMOST_BOT_TOKEN`, URL via `MATTERMOST_URL`
- Microsoft Teams - Via msteams extension
- Google Chat - Via googlechat extension
- LINE - Via line extension
- Zalo - Bot token via `ZALO_BOT_TOKEN`
- Feishu/Lark - Via feishu extension
- QQ - Via qqbot extension
- Nostr - Via nostr extension
- Signal - Via signal extension
- Synology Chat - Via synology-chat extension
- Twilio (Voice) - Via voice-call extension
- Nextcloud Talk - Via nextcloud-talk extension

**Voice/Audio:**
- ElevenLabs - API key via `ELEVENLABS_API_KEY` or `XI_API_KEY`
- Deepgram - API key via `DEEPGRAM_API_KEY`
- Node-edge-tts - Local TTS engine

**Image Generation:**
- OpenAI DALL-E (via openai extension)
- Stability AI (via image-generation-core extension)
- Fal.ai (via fal extension)

**Memory/Vector Storage:**
- LanceDB - Via memory-lancedb extension (sqlite-vec for embeddings)
- Qdrant - Via memory-core extension
- Chroma - Via memory-core extension

**Authentication:**
- GitHub OAuth (via github-copilot extension)
- OAuth 2.0 flows for various providers
- API key authentication for providers

## Data Storage

**Databases:**
- SQLite (node:sqlite built-in) - Local application data, task registry
  - Connection: Local filesystem via `OPENCLAW_STATE_DIR`
  - Client: Built-in `node:sqlite`
- PostgreSQL - Used by paperclip db package
  - Connection: Via `postgres` npm package and embedded-postgres
  - ORM: Drizzle ORM

**File Storage:**
- Local filesystem (default)
  - State directory: `~/.openclaw`
  - Workspace: `~/.openclaw/workspace`
- Archives: tar and zip handling via JSZip and tar packages

**Caching:**
- In-memory caching via runtime structures
- No external cache service (Redis, etc.) detected

## Authentication & Identity

**Auth Providers:**
- Custom token-based auth via `OPENCLAW_GATEWAY_TOKEN`
- Password auth via `OPENCLAW_GATEWAY_PASSWORD`
- OAuth flows for provider authentication
- API keys for model providers

**Session Management:**
- File-based session storage in `~/.openclaw/sessions/`
- Gateway token authentication for CLI-gateway communication

## Monitoring & Observability

**Error Tracking:**
- Structured logging via `tslog` package
- Custom logger in `src/logger.ts`
- No external error tracking service detected (Sentry, etc.)

**Logs:**
- Application logs via tslog
- CLI output with chalk for syntax highlighting
- Docker logs accessible via `docker logs`

## CI/CD & Deployment

**Hosting:**
- Docker - Primary deployment method
- Native macOS app (via Swift/SwiftUI)
- Native iOS app (via Swift)
- Native Android app (via Kotlin)

**CI Pipeline:**
- GitHub Actions - Primary CI/CD
- Workflows: PR checks, E2E tests, Docker builds, release process

**Docker:**
- Multi-stage Dockerfile for minimal runtime images
- docker-compose.yml for local gateway deployment
- Base image: Node 24 Bookworm

## Environment Configuration

**Required env vars:**
- `OPENCLAW_GATEWAY_TOKEN` - Gateway authentication token
- Provider API keys as needed (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
- Channel tokens as needed (e.g., `TELEGRAM_BOT_TOKEN`, `DISCORD_BOT_TOKEN`)

**Secrets location:**
- Environment variables (process env)
- `.env` files (local development)
- `~/.openclaw/.env` (system-wide daemon)
- `openclaw.json` config file with `env` block

## Webhooks & Callbacks

**Incoming:**
- Channel webhook endpoints (Telegram, Discord, Slack, etc.)
- Gateway health check: `GET /healthz`

**Outgoing:**
- Channel integrations receive and send messages
- MCP tools exposed via `@modelcontextprotocol/sdk`

## Mobile Platforms

**iOS:**
- Swift/SwiftUI application
- Framework: Observation, native Apple frameworks
- Build: Xcode via xcodegen

**Android:**
- Kotlin with Gradle
- Build: `./gradlew` commands

**Desktop (macOS):**
- Swift/SwiftUI application
- OpenClaw.app bundle

---

*Integration audit: 2026-04-05*
