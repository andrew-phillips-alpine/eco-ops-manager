# Testing Cleanup Checklist

Before pushing to `main` or `production`, complete this checklist:

## Data Hygiene

- [ ] No hardcoded test data that overwrites real DB entries
- [ ] Sample data creation scripts are disabled/removed for production
- [ ] Mock mode paths are non-persistent and reset on restart

## Environment & Secrets

- [ ] `.env` is NOT committed (verify with `git status`)
- [ ] `.env.example` contains all required variables
- [ ] No API keys or secrets in source code
- [ ] All secrets configured in GitHub Secrets

## Code Quality

- [ ] No `console.log` statements (except in logger.js)
- [ ] No TODO comments that block functionality
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)

## Database

- [ ] Indexes are defined in storage block init()
- [ ] No test data seeded in production collections
- [ ] Collection names use correct prefix

## API Routes

- [ ] All routes have error handling
- [ ] All routes call sendErrorAlert on failure
- [ ] Input validation on POST/PUT routes
- [ ] No hardcoded URLs or ports

## Documentation

- [ ] README.md is up to date
- [ ] BUILD_OVERVIEW.md reflects current implementation
- [ ] API endpoints documented
- [ ] Environment variables documented

## Deployment

- [ ] Dockerfile builds successfully
- [ ] docker-compose.yml has all env vars
- [ ] deploy.yml secrets match required vars
- [ ] Domain configured in Traefik labels

## Final Verification

```bash
# Test build
npm run build

# Test production server locally
USE_MOCK_DATA=false NEXT_PUBLIC_USE_MOCK_DATA=false FORM_ENDPOINT=... DATABASE_URL=... OPENWEATHER_API_KEY=... node server.js

# Check for .env in git
git status | grep -v ".env"
```

---

When all items are checked, proceed with:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```
