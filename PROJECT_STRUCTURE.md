# 📂 Project Structure

> Clean, organized directory structure for Social Media Automator

## 🏗️ Root Directory

```
social-media-automator/
├── server.js                       # Main Express server (230K lines)
├── package.json                    # Dependencies & scripts
├── .env                            # Environment variables (not in git)
├── README.md                       # Main documentation
├── DOCS_INDEX.md                   # Documentation index
├── CHANGELOG.md                    # Version history
├── CODEMAP.md                      # Code navigation guide
└── PROJECT_STRUCTURE.md            # This file
```

## 📁 Key Directories

### `/config` - Configuration Files
```
config/
├── supabase.js                    # Supabase client setup
├── anthropic.js                   # AI client setup
└── platforms/                     # Platform API configs
    ├── linkedin.js
    ├── twitter.js
    └── ...
```

### `/services` - Business Logic
```
services/
├── auth/                          # Authentication services
│   └── oauth-handlers.js
├── platforms/                     # Platform posting logic
│   ├── linkedin.service.js
│   ├── twitter.service.js
│   └── ...
├── ai/                            # AI services
│   ├── content-agent.js          # Content generation agent
│   ├── analytics-agent.js        # Analytics insights agent
│   └── caption-generator.js
└── scheduling/                    # Scheduling & cron
    └── auto-poster.js
```

### `/utilities` - Helper Functions
```
utilities/
├── logger.js                      # Logging utility
├── validators.js                  # Input validation
├── formatters.js                  # Data formatting
└── error-handlers.js              # Error handling
```

### `/dashboard` - React Frontend
```
dashboard/
├── public/                        # Static assets
├── src/
│   ├── App.jsx                   # Main app component
│   ├── index.jsx                 # Entry point
│   ├── components/               # Reusable components
│   │   ├── Layout/
│   │   ├── Calendar/
│   │   ├── Analytics/
│   │   └── ...
│   ├── pages/                    # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── Compose.jsx
│   │   ├── Calendar.jsx
│   │   ├── Analytics.jsx
│   │   └── ...
│   ├── utils/                    # Frontend utilities
│   │   ├── api.js               # API client
│   │   ├── auth.js              # Auth helpers
│   │   └── constants.js
│   └── styles/                   # CSS files
│       └── index.css
├── dist/                         # Production build (auto-generated)
├── package.json
└── vite.config.js                # Vite configuration
```

### `/chrome-extension` - Browser Extension
```
chrome-extension/
├── manifest.json                  # Extension configuration
├── popup.html                     # Extension UI
├── popup.js                       # Extension logic
├── content-script.js              # Page injection
├── background.js                  # Service worker
├── manual-settings.html           # Token entry page
├── icons/                         # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── icon-512.png
├── styles/                        # Extension CSS
│   ├── popup.css
│   └── content.css
├── utils/                         # Extension utilities
│   ├── constants.js
│   ├── storage.js
│   └── api-client.js
├── README.md                      # Extension documentation
├── SETUP_GUIDE.md                 # Setup instructions
└── TESTING.md                     # Testing guide
```

### `/landing` - Marketing Website
```
landing/
├── public/                        # Static assets
├── src/
│   ├── App.jsx
│   ├── components/               # Landing page components
│   └── styles/
├── package.json
└── vite.config.js
```

### `/docs` - Documentation
```
docs/
├── README.md                      # Docs overview
├── MASTER_INDEX.md                # Complete index
├── getting-started/               # Setup guides
│   ├── quick-start.md
│   ├── environment-setup.md
│   ├── project-overview.md
│   └── supabase-setup.md
├── features/                      # Feature documentation
│   ├── oauth.md
│   ├── ai-generation.md
│   ├── content-recycling.md
│   ├── templates.md
│   ├── webhooks.md
│   └── ...
├── platforms/                     # Platform-specific docs
│   ├── linkedin.md
│   ├── twitter.md
│   ├── facebook.md
│   └── ...
├── agents/                        # AI agent documentation
│   ├── CONTENT-AGENT-README.md
│   ├── ANALYTICS-AGENT-README.md
│   └── DEPLOYMENT-CHECKLIST.md
└── deployment/                    # Deployment guides
    ├── DEPLOYMENT_GUIDE.md
    ├── PRODUCTION_WARNINGS.md
    ├── api-reference.md
    ├── platform-status.md
    └── urls-reference.md
```

### `/migrations` - Database Migrations
```
migrations/
├── 001_initial_schema.sql
├── 002_add_teams.sql
├── 003_add_agents.sql
└── ...
```

### `/scripts` - Utility Scripts
```
scripts/
├── setup-db.js                    # Database setup
├── seed-data.js                   # Test data seeding
└── README.md                      # Scripts documentation
```

### `/archive` - Deprecated Files
```
archive/
├── README.md                      # Archive documentation
└── deprecated-docs/               # Old documentation
    ├── BEFORE_AFTER_COMPARISON.md
    ├── FEATURES.md
    ├── GOOGLE_OAUTH_IMPLEMENTATION_SUMMARY.md
    └── ...
```

## 🚫 Ignored Directories (not in git)

```
node_modules/                      # Dependencies (npm install)
dashboard/dist/                    # Frontend build (auto-generated)
landing-dist/                      # Landing build (auto-generated)
uploads/                           # User-uploaded files
.env                               # Environment variables
.DS_Store                          # macOS files
```

## 📄 Important Files

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js dependencies & scripts |
| `.env` | Environment variables (create from `.env.example`) |
| `nodemon.json` | Development server config |
| `railway.json` | Railway deployment config |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `DOCS_INDEX.md` | Documentation index |
| `CODEMAP.md` | Code navigation guide |
| `CHANGELOG.md` | Version history |
| `TESTING_GUIDE.md` | Testing documentation |
| `DEPLOYMENT_STATUS.md` | Current deployment status |
| `CHROME_EXTENSION_QUICK_START.md` | Extension quick start |
| `GOOGLE_OAUTH_SETUP.md` | OAuth setup guide |

## 🗂️ File Naming Conventions

### Backend Files
- **Services:** `platform-name.service.js` (e.g., `linkedin.service.js`)
- **Utilities:** `function-name.js` (e.g., `logger.js`)
- **Config:** `service-name.js` (e.g., `supabase.js`)

### Frontend Files
- **Components:** PascalCase (e.g., `Calendar.jsx`)
- **Pages:** PascalCase (e.g., `Dashboard.jsx`)
- **Utilities:** camelCase (e.g., `api.js`)
- **Styles:** kebab-case (e.g., `dashboard-styles.css`)

### Documentation Files
- **Guides:** SCREAMING_SNAKE_CASE (e.g., `QUICK_START.md`)
- **Feature Docs:** kebab-case (e.g., `ai-generation.md`)
- **Platform Docs:** lowercase (e.g., `linkedin.md`)

## 📊 Directory Sizes (Approximate)

| Directory | Size | Files | Purpose |
|-----------|------|-------|---------|
| `/` (root) | 230KB | 1 | Main server |
| `/services` | ~50KB | ~20 | Business logic |
| `/dashboard` | ~2MB | ~100 | React frontend |
| `/chrome-extension` | ~50KB | ~15 | Browser extension |
| `/docs` | ~500KB | ~50 | Documentation |
| `/node_modules` | ~500MB | ~5000 | Dependencies (ignored) |

## 🔍 Quick Navigation

### Finding Code

```bash
# Find all services
find services/ -name "*.js"

# Find platform integrations
find services/platforms/ -name "*.js"

# Find React components
find dashboard/src/components/ -name "*.jsx"

# Find documentation
find docs/ -name "*.md"
```

### Common Paths

| What | Where |
|------|-------|
| Main server | `./server.js` |
| Platform APIs | `./services/platforms/` |
| AI agents | `./services/ai/` |
| React app | `./dashboard/src/App.jsx` |
| Extension popup | `./chrome-extension/popup.js` |
| API routes | Search `server.js` for `app.get` or `app.post` |
| Database config | `./config/supabase.js` |
| Environment vars | `./.env` |

## 🎯 Key Concepts

### Separation of Concerns

- **`/services`** - All business logic
- **`/config`** - All configuration
- **`/utilities`** - Reusable helpers
- **`/dashboard`** - Frontend only
- **`/chrome-extension`** - Extension only

### Modularity

Each platform has its own service file with:
- OAuth flow
- Post creation
- Account management
- Error handling

### Documentation Structure

- **Root docs** - Quick starts & overviews
- **`/docs/getting-started`** - Setup guides
- **`/docs/features`** - Feature documentation
- **`/docs/platforms`** - Platform-specific guides
- **`/docs/deployment`** - Production guides

---

**Last Updated:** November 13, 2025
**Maintainer:** Project Team

📖 **See Also:**
- [CODEMAP.md](CODEMAP.md) - Code navigation
- [DOCS_INDEX.md](DOCS_INDEX.md) - Documentation index
- [README.md](README.md) - Project overview
