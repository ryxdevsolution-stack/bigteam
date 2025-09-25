# BigTeam Platform - Claude Code Guide

## Project Overview
BigTeam is a community engagement platform with Instagram/TikTok-style content features, built as a Phase 1 CRM solution with modern web technologies.

## Tech Stack Summary
- **Frontend**: React 18 + TypeScript, Redux Toolkit, Tailwind CSS, Vite
- **Backend**: Python Flask, JWT Auth, SQLAlchemy, Flask-RESTful
- **Database**: Supabase (PostgreSQL), Redis for caching
- **Infrastructure**: Docker, Kubernetes, NGINX

## Key Development Commands

### Backend Commands
```bash
# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python app.py

# Run tests
pytest tests/

# Lint Python code
flake8 app/
black app/
```

### Frontend Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:e2e

# Lint and typecheck
npm run lint
npm run typecheck
```

### Docker Commands
```bash
# Start all services
docker-compose up -d

# Build images
docker build -t bigteam/backend:latest ./backend
docker build -t bigteam/frontend:latest ./frontend
```

## Project Structure
- `/frontend` - React TypeScript application
  - `/src/components` - Reusable UI components (admin/user/shared)
  - `/src/pages` - Page components (admin/user)
  - `/src/store` - Redux configuration
  - `/src/services` - API service layer
- `/backend` - Flask Python API
  - `/app/api` - API endpoints (admin/user/auth)
  - `/app/models` - Database models
  - `/app/services` - Business logic
- `/infrastructure` - DevOps configurations (Docker/K8s/NGINX)

## API Endpoint Patterns
- Auth: `/api/auth/*` - Authentication endpoints
- Admin: `/api/admin/*` - Admin-only endpoints
- User: `/api/user/*` - User-specific endpoints
- Public: `/api/posts/*` - Public content endpoints

## Database Tables
1. **users** - User accounts with roles (admin/user)
2. **posts** - Content posts (videos/images)
3. **advertisements** - Ad management
4. **user_interactions** - Likes, shares, views

## Environment Variables Required
- Backend: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET_KEY`, `REDIS_URL`
- Frontend: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Development Guidelines
1. Always check existing components/patterns before creating new ones
2. Follow existing code style and conventions
3. Use TypeScript types for all frontend code
4. Implement proper error handling and validation
5. Write tests for new features
6. Use existing libraries (don't add new dependencies without checking)

## Current Phase & Features
**Phase 1 (Current):**
- User authentication system
- Admin panel for user/content management
- Content upload and publishing
- User feed with social interactions
- Advertisement system with scheduling

## Testing Requirements
- Backend: Use pytest for Python tests
- Frontend: Use Vitest for unit tests, Playwright for E2E
- Always run linting before commits
- Test API endpoints with proper authentication

## Security Considerations
- JWT tokens for authentication
- Role-based access control (RBAC)
- Input validation on all endpoints
- File upload restrictions (type/size)
- CORS configuration for API access
- No secrets in code - use environment variables

## Performance Optimizations
- Redis caching for sessions and frequent data
- CDN for static assets and media
- Database indexing on frequently queried fields
- Lazy loading for media content
- Pagination for list endpoints

## ⚠️ STRICT DEVELOPMENT RULES - MUST FOLLOW ALWAYS

### 1. NO HARDCODING
- **NEVER hardcode values** - Use environment variables, config files, or constants
- **NEVER hardcode pixel values** - Use relative units (rem, em, %, vh, vw) or Tailwind classes
- **NEVER hardcode API endpoints** - Use environment variables
- **NEVER hardcode credentials or secrets** - Use .env files

### 2. NO DUPLICATION
- **NEVER duplicate code** - Create reusable components/functions
- **NEVER create duplicate files** - Check existing files first
- **NEVER copy-paste code blocks** - Extract to shared utilities
- **NO overlapping functionality** - Reuse existing implementations

### 3. NO MOCK DATA IN PRODUCTION CODE - ABSOLUTE RULE
- **NEVER use mock/dummy/fake/sample data** in ANY production files
- **NEVER generate random data** with Math.random() or similar functions
- **NEVER hardcode test values** like "User123", "test@example.com", etc.
- **Always use real-time data** from database/API only
- **Remove ALL test data immediately** before finalizing features
- **Keep mock data only in test files** or development seeds
- **If no real data exists, show "No data available"** instead of generating fake data

### 4. RESPONSIVE DESIGN REQUIREMENTS
- **MUST be fully responsive** for ALL screen sizes (mobile, tablet, desktop, 4K)
- **Use Tailwind responsive classes** (sm:, md:, lg:, xl:, 2xl:)
- **NEVER use fixed pixel widths** for layout elements
- **Use flexible containers** (flex, grid) with responsive breakpoints
- **Test on multiple screen sizes** before considering feature complete

### 5. FILE CREATION RULES
- **ALWAYS check existing files first** before creating new ones
- **Analyze similar components/modules** to understand patterns
- **Only create new files when absolutely necessary**
- **Reuse and extend existing files** whenever possible
- **Document why new file is needed** if creation is required

### 6. DEPENDENCY MANAGEMENT
- **Remove unused dependencies immediately**
- **Run dependency audit regularly**
- **Delete unused imports** in every file
- **Check package.json/requirements.txt** for unused libraries
- **Use `npm prune` or `pip-autoremove`** to clean dependencies

### 7. CLEAN CODEBASE MAINTENANCE
- **Delete test files after testing** is complete
- **Remove commented-out code** immediately
- **Delete unused components/functions**
- **Clean up console.logs and debug statements**
- **Remove temporary files** and backup files
- **Keep only production-ready code** in main branches

### 8. REAL-TIME DATA REQUIREMENTS
- **Always fetch fresh data** from APIs/database
- **Implement proper data refresh** mechanisms
- **Use WebSockets or polling** for real-time updates
- **Cache appropriately** but always validate freshness
- **Handle offline scenarios** gracefully

### 9. PERFORMANCE OPTIMIZATION - CRITICAL
- **NEVER make duplicate API calls** - Use shared data contexts
- **Implement request deduplication** - Return existing promises for concurrent requests
- **Use connection pooling** for database connections
- **Cache API responses** with 5-second TTL minimum
- **Batch API calls** when possible instead of multiple individual calls
- **Response times MUST be under 500ms** for API endpoints
- **Use performance timing** to log slow operations (>100ms)
- **NEVER call fetchPosts() after adding new post** - Update state locally
- **Implement optimistic UI updates** - Update UI before API confirms
- **Use React.memo and useMemo** to prevent unnecessary re-renders

## 📋 CLAUDE CODE CHECKLIST (Run Before Every Task Completion)

Before marking any task complete, verify:

✅ **Code Quality**
- [ ] No hardcoded values (check for pixels, URLs, credentials)
- [ ] No duplicate code or files
- [ ] No mock/dummy data in production code
- [ ] All components are responsive (test at 320px, 768px, 1024px, 1440px, 1920px)

✅ **File Management**
- [ ] Checked existing files before creating new ones
- [ ] Removed all unused dependencies
- [ ] Deleted test files after testing
- [ ] Cleaned up all debug code and console.logs

✅ **Dependencies**
- [ ] Removed unused imports from all files
- [ ] Removed unused packages from package.json/requirements.txt
- [ ] No unnecessary libraries added

✅ **Data Handling**
- [ ] Using real-time data from proper sources
- [ ] No static/mock data in components
- [ ] Proper error handling for data fetching

## 🚨 AUTOMATIC ACTIONS TO TAKE

When working on any task, Claude Code should automatically:

1. **Before creating any file**: Search and analyze existing files with similar names or functionality
2. **After modifying code**: Check for and remove unused imports
3. **After completing feature**: Delete any test/temporary files created
4. **When adding styles**: Use Tailwind classes or relative units, never pixels
5. **When fetching data**: Always use environment variables for endpoints
6. **After installing packages**: Verify they're actually used or remove them
7. **Before committing**: Run linters and remove all debug code

## 💡 REMEMBER
- **Quality over Speed**: Better to reuse/refactor than create new
- **Mobile-First**: Start responsive design from smallest screen
- **Clean as You Go**: Don't accumulate technical debt
- **Real Data Only**: Production code should never have fake data
- **Less is More**: Minimal files, minimal dependencies, maximum reuse