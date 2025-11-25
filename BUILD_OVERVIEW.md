# Build Overview - Eco-Ops Manager

## Architecture

**Framework:** Next.js Static Export + Custom Node Server
**Version:** 1.0.0
**Build ID:** 2025-11-23-001

This app uses the Think It Do It App Factory architecture:
- Next.js generates static HTML/CSS/JS at build time
- Custom Node server (server.js) serves static files AND handles API routes
- All backend logic lives in `/app/blocks/`

## Blocks Used

| Block ID | Type | Route | Description |
|----------|------|-------|-------------|
| `storage-mongodb` | storage | - | MongoDB database access for hours logging |
| `api-multi-fetch` | api | `/api/data/sync` | Fetches weather (OpenWeather) and utility data |
| `logic-data-aggregator` | logic | `/api/dashboard/stats` | Calculates efficiency metrics |
| `ui-dashboard-admin` | ui | - | React dashboard with charts and forms |
| `communication-error-alert` | communication | - | Error alerting to Formspree |

## API Route Map

| Route | Method | Handler Block | Auth Required |
|-------|--------|---------------|---------------|
| `/api/dashboard/stats` | GET | logic-data-aggregator | No |
| `/api/data/sync` | GET | api-multi-fetch | No |
| `/api/hours/log` | POST | storage-mongodb | No |
| `/api/hours` | GET | storage-mongodb | No |
| `/api/health` | GET | (inline) | No |

## Database Schema

### Collection: `eco_ops_hours`

```json
{
  "id": "string (unique)",
  "staffName": "string",
  "hours": "number (0-24)",
  "date": "string (ISO date YYYY-MM-DD)",
  "createdAt": "string (ISO timestamp)"
}
```

**Indexes:**
- `date: -1` (descending)
- `staffName: 1` (ascending)
- `createdAt: -1` (descending)

## External Services

### OpenWeather API
- **Purpose:** Get current temperature and weather conditions
- **Endpoint:** `api.openweathermap.org/data/2.5/weather`
- **Env Var:** `OPENWEATHER_API_KEY`

### MongoDB Atlas
- **Purpose:** Store staff hours entries
- **Env Var:** `DATABASE_URL`

### Formspree
- **Purpose:** Error alerting
- **Env Var:** `FORM_ENDPOINT`

## Design System

### Colors
- **Primary:** Green (#16a34a) - eco/sustainability theme
- **Background:** Gray-50 (#f9fafb)
- **Text:** Gray-900 (#111827)
- **Cards:** White with shadow

### Typography
- System font stack (Apple, Segoe UI, Roboto)
- Base size: 16px
- Headings: Bold, 3xl for h1

### Components
- `.card` - White rounded container with shadow
- `.btn-primary` - Green button
- `.btn-secondary` - Gray button
- `.stat-card` - Metric display card
- `.chart-container` - Responsive chart wrapper

## Environment Variables

### Required for Production
- `FORM_ENDPOINT` - Formspree endpoint (always required)
- `DATABASE_URL` - MongoDB Atlas connection string
- `OPENWEATHER_API_KEY` - Weather API access

### Optional
- `APP_NAME` - Defaults to "eco-ops-manager"
- `PORT` - Defaults to 3000
- `NODE_ENV` - development/production
- `USE_MOCK_DATA` - Enable mock mode for API/server (defaults to true locally)
- `NEXT_PUBLIC_USE_MOCK_DATA` - Enable mock mode for UI (defaults to true locally)
- `UTILITY_API_URL` - Optional utility billing API endpoint
- `UTILITY_API_TOKEN` - Optional bearer token for utility API authentication

## Mock Mode

- Triggered when `USE_MOCK_DATA=true` (server) and `NEXT_PUBLIC_USE_MOCK_DATA=true` (client).
- Storage uses in-memory arrays; API block returns static weather/utility data; logic block serves pre-calculated dashboard stats.
- Skips external API/DB calls and external error alerts; responses include `mock: true`.
- UI surfaces a yellow “Mock mode enabled” badge.

## Failure Modes & Recovery

### Database Connection Failure
- **Behavior:** Server fails to start
- **Recovery:** Check DATABASE_URL, MongoDB Atlas status
- **Alert:** Sent to FORM_ENDPOINT

### Weather API Failure
- **Behavior:** Falls back to cached/mock weather data and logs warning
- **Recovery:** Check API key validity and outbound network
- **Alert:** Sent to FORM_ENDPOINT when failures occur in live mode

### Server Crash
- **Behavior:** Docker restarts container
- **Recovery:** Check logs with `docker logs eco-ops-manager`
- **Rescue Mode:** Override CMD to `["serve", "-s", "out", "-l", "3000"]`

## Deployment

### Domain
`eco-ops-manager.thealpinesystem.com`

### Registry
`ghcr.io/andrew-phillips-alpine/eco-ops-manager:latest`

### Server Path
`/build-labs/apps/eco-ops-manager/`

### Traefik Labels
- Router rule: Host eco-ops-manager.thealpinesystem.com
- Entrypoints: websecure
- TLS: enabled with letsencrypt
- Health check interval: 0 (disabled)

## Guardrail Versions

- **Architecture:** Static Export + Custom Node v1.1
- **Protocols:** PROTOCOLS_AND_SPECS v1.1
- **Deployment:** Hetzner + Traefik + GHCR

## Pre-Deployment Checklist

- [ ] All secrets added to GitHub Secrets
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Domain DNS configured
- [ ] `.env` not committed (check .gitignore)
