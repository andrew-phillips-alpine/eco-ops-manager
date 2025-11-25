# Eco-Ops Manager

Operations dashboard cross-referencing staff hours, outdoor temp, and electricity costs.

**Architecture:** Static Export app served by a custom Node server.

## Quick Start

### Development (Mock Mode Default)

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (Mock)
npm start
# (start.sh sets USE_MOCK_DATA/NEXT_PUBLIC_USE_MOCK_DATA so no keys are needed)
```

### Development (Live Services)

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (requires real env vars)
USE_MOCK_DATA=false NEXT_PUBLIC_USE_MOCK_DATA=false FORM_ENDPOINT=... DATABASE_URL=... OPENWEATHER_API_KEY=... node server.js
```

## Required Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `FORM_ENDPOINT` | Yes | Formspree endpoint for error alerts |
| `DATABASE_URL` | Yes | MongoDB connection string |
| `OPENWEATHER_API_KEY` | Yes | OpenWeather API key |
| `USE_MOCK_DATA` | No | Toggle mock mode for API/server (`true` by default locally) |
| `NEXT_PUBLIC_USE_MOCK_DATA` | No | Toggle mock mode for UI (`true` by default locally) |
| `NEXT_PUBLIC_API_BASE` | No | API base URL for the frontend (defaults to same-origin; start.sh sets local backend) |
| `UTILITY_API_URL` | No | Optional utility billing API endpoint |
| `UTILITY_API_TOKEN` | No | Optional bearer token for utility API |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Aggregated dashboard statistics |
| GET | `/api/data/sync` | Sync weather and utility data |
| POST | `/api/hours/log` | Log staff hours |
| GET | `/api/hours` | Get logged hours |
| GET | `/api/health` | Health check |

## Project Structure

```
/app
  /blocks
    /api          - External API integrations
    /communication - Error alerts and logging
    /logic        - Business rules
    /storage      - MongoDB database access
    /ui           - React components
  /config
    env.js        - Environment loader
  /shared
    types.ts      - Zod schemas and TypeScript types
  /styles
    globals.css   - Global styles
  layout.tsx      - Root layout
  page.tsx        - Main page
server.js         - Custom Node server (API + static serving)
```

## Deployment

### GitHub Actions (Automatic)

Push to `main` branch triggers automatic deployment to Hetzner.

### Required GitHub Secrets

- `HETZNER_HOST` - Server IP/hostname
- `HETZNER_USER` - SSH username
- `HETZNER_SSH_KEY` - SSH private key
- `FORM_ENDPOINT` - Formspree endpoint
- `DATABASE_URL` - MongoDB connection string
- `OPENWEATHER_API_KEY` - OpenWeather API key
- (Optional) `UTILITY_API_URL` / `UTILITY_API_TOKEN` - Utility billing API access

### Production URL

`https://eco-ops-manager.thealpinesystem.com`

## Build Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Build static export to /out
npm run server   # Start Node API server
npm start        # Start both (via start.sh)
```

## Architecture Details

See [BUILD_OVERVIEW.md](./BUILD_OVERVIEW.md) for complete architecture documentation.

## Troubleshooting

### Mock Mode Not Working

Ensure `USE_MOCK_DATA=true` and `NEXT_PUBLIC_USE_MOCK_DATA=true` are set (start.sh sets both). A yellow “Mock mode enabled” badge appears in the UI when active.

### Database Connection Errors

1. Check `DATABASE_URL` is correct
2. Verify MongoDB Atlas IP whitelist
3. Check network connectivity

### API Key Errors

Requests will fail if `OPENWEATHER_API_KEY` is missing or invalid. Verify the key and ensure outbound network access to `api.openweathermap.org`.

## License

Proprietary - Alpine GTM Consulting
