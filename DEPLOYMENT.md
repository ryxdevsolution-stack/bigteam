# BigTeam Platform - Deployment Guide

This guide provides step-by-step instructions for deploying the BigTeam platform to production using Render (backend) and Vercel (frontend).

## Prerequisites

- Git repository with the latest code
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Supabase project with database configured
- All environment variables ready

---

## Backend Deployment (Render)

### Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed to your Git repository
2. Verify [render.yaml](render.yaml) exists in the root directory
3. Verify [requirements.txt](backend/requirements.txt) includes `gunicorn==21.2.0`
4. Verify `__init__.py` files exist in all backend package directories (routes, models, services, utils)

### Step 2: Create Render Web Service

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Your Repository**
   - Select your Git provider (GitHub/GitLab)
   - Choose the BigTeam repository
   - Click "Connect"

3. **Configure Service Settings**

   **Option A: Using render.yaml (Recommended)**
   - Render will auto-detect the [render.yaml](render.yaml) file
   - All settings will be configured automatically
   - Just review and confirm the settings

   **Option B: Manual Configuration**
   - **Name**: `bigteam-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your production branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 60 app:app`

4. **Add Environment Variables**

   Click "Advanced" → "Add Environment Variable" and add the following:

   ```
   FLASK_ENV=production

   # Database Configuration
   DB_URL=postgresql://username:password@host:port/database
   DB_HOST=db.xxxxx.supabase.co
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASS=your-database-password
   DB_PORT=5432

   # Supabase Configuration
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_KEY=your-supabase-service-role-key

   # JWT Secret (generate a secure random string)
   JWT_SECRET_KEY=your-secure-random-secret-key-here

   # Frontend URL (will be updated after Vercel deployment)
   FRONTEND_URL=https://your-app.vercel.app

   # Optional: Redis (if using)
   REDIS_URL=redis://your-redis-url
   ```

   **Important**: Update `FRONTEND_URL` after deploying the frontend to Vercel

5. **Select Instance Type**
   - Free tier is sufficient for testing
   - Upgrade to paid tier for production use

6. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your backend
   - Wait for deployment to complete (5-10 minutes)

7. **Note Your Backend URL**
   - After deployment, copy your backend URL
   - Format: `https://bigteam-backend.onrender.com`
   - You'll need this for frontend configuration

### Step 3: Verify Backend Deployment

1. **Check Health Endpoint**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Expected response:
   ```json
   {"status": "healthy", "environment": "production"}
   ```

2. **Check Logs**
   - Go to Render Dashboard → Your Service → Logs
   - Verify no errors during startup

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Your Repository

1. Verify [vercel.json](frontend/vercel.json) exists in the `frontend` directory
2. Verify [vite.config.ts](frontend/vite.config.ts) is updated with environment variable support
3. Verify [.env.example](frontend/.env.example) includes `VITE_API_URL`

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Log in to Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Select your Git provider (GitHub/GitLab)
   - Choose the BigTeam repository
   - Click "Import"

3. **Configure Project Settings**
   - **Project Name**: `bigteam-frontend` (or your preferred name)
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Add Environment Variables**

   In the "Environment Variables" section, add:

   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

   Replace with your actual Render backend URL from previous step.

   **Optional**: If using Supabase directly from frontend:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy
   - Wait for deployment to complete (2-5 minutes)

6. **Note Your Frontend URL**
   - After deployment, copy your frontend URL
   - Format: `https://bigteam-frontend.vercel.app`

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add VITE_API_URL
# Enter your backend URL when prompted
```

### Step 3: Update Backend CORS Settings

1. **Update Backend Environment Variables**
   - Go back to Render Dashboard
   - Navigate to your backend service → Environment
   - Update `FRONTEND_URL` with your Vercel URL:
     ```
     FRONTEND_URL=https://your-app.vercel.app
     ```
   - Save changes
   - Render will automatically redeploy

2. **Verify CORS Configuration**
   - The backend [app.py](backend/app.py:21-30) is configured to accept requests from your Vercel domain
   - It also accepts all `*.vercel.app` subdomains for preview deployments

### Step 4: Verify Frontend Deployment

1. **Open Your Application**
   - Visit your Vercel URL in a browser
   - Test user registration/login
   - Verify API calls are working

2. **Check Browser Console**
   - Open Developer Tools → Console
   - Verify no CORS errors
   - Check Network tab for successful API calls

---

## Post-Deployment Configuration

### 1. Custom Domain Setup (Optional)

#### For Backend (Render):
1. Go to Render Dashboard → Your Service → Settings
2. Scroll to "Custom Domain"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed
5. Update `FRONTEND_URL` in environment variables if needed

#### For Frontend (Vercel):
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `yourdomain.com`)
3. Update DNS records as instructed
4. Update `FRONTEND_URL` in Render backend environment variables

### 2. Enable Auto-Deploy

Both Render and Vercel automatically deploy on Git push:

- **Render**: Deploys on push to configured branch (main)
- **Vercel**: Deploys on push to main (production) and creates preview deployments for other branches

### 3. Database Migrations

If you need to run database migrations:

```bash
# SSH into Render shell (from Render dashboard)
python create_tables.py
python mlm_migration.py
```

Or use Render's "Shell" feature from the dashboard.

### 4. Environment Variables Security

**IMPORTANT**: Never commit `.env` files to Git!

- Backend `.env` is in `.gitignore`
- Use Render's environment variable dashboard
- Use Vercel's environment variable dashboard
- Rotate secrets regularly

---

## Monitoring & Maintenance

### Backend Monitoring (Render)

1. **Health Checks**
   - Render automatically monitors `/health` endpoint
   - View health status in dashboard

2. **Logs**
   - Access logs: Render Dashboard → Your Service → Logs
   - Real-time log streaming available

3. **Metrics**
   - CPU/Memory usage: Dashboard → Metrics tab
   - Set up alerts for high resource usage

### Frontend Monitoring (Vercel)

1. **Analytics**
   - Enable Vercel Analytics in project settings
   - Track page views, performance metrics

2. **Build Logs**
   - View deployment logs: Dashboard → Deployments → Select deployment
   - Troubleshoot build failures

3. **Function Logs** (if using serverless functions)
   - View logs in Vercel dashboard

### Performance Optimization

1. **Enable Caching**
   - Vercel automatically caches static assets
   - Configure Redis for backend API caching

2. **CDN Configuration**
   - Vercel uses global CDN automatically
   - Optimize images and media files

3. **Database Connection Pooling**
   - Configure in backend for better performance
   - Monitor active connections in Supabase

---

## Troubleshooting

### Common Backend Issues

**Issue**: Service won't start
- **Solution**: Check logs for missing environment variables
- Verify all required variables are set in Render

**Issue**: Database connection errors
- **Solution**: Verify `DB_URL` is correct
- Check Supabase is accessible from Render's IP
- Verify credentials are correct

**Issue**: CORS errors
- **Solution**: Verify `FRONTEND_URL` matches your Vercel domain
- Check [app.py](backend/app.py) CORS configuration

### Common Frontend Issues

**Issue**: API calls failing
- **Solution**: Verify `VITE_API_URL` is set correctly
- Check backend is running (visit `/health` endpoint)
- Check browser console for errors

**Issue**: Blank page after deployment
- **Solution**: Check build logs in Vercel
- Verify all environment variables are set
- Check for console errors in browser

**Issue**: 404 on page refresh
- **Solution**: [vercel.json](frontend/vercel.json) should have rewrite rules configured
- Verify `vercel.json` is in the frontend directory

---

## Rollback Procedures

### Render Rollback

1. Go to Render Dashboard → Your Service → Events
2. Find previous successful deployment
3. Click "Rollback" button
4. Confirm rollback

### Vercel Rollback

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Confirm promotion

---

## CI/CD Pipeline (Optional)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        # Render auto-deploys on push
        run: echo "Render will auto-deploy"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        # Vercel auto-deploys on push
        run: echo "Vercel will auto-deploy"
```

---

## Security Checklist

- [ ] All environment variables set correctly
- [ ] `.env` files not committed to Git
- [ ] JWT_SECRET_KEY is strong and unique
- [ ] Database credentials are secure
- [ ] CORS is configured properly
- [ ] HTTPS is enabled on both frontend and backend
- [ ] Rate limiting configured (if applicable)
- [ ] File upload restrictions in place
- [ ] SQL injection protection verified
- [ ] XSS protection verified

---

## Support & Resources

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Flask Documentation**: https://flask.palletsprojects.com
- **Vite Documentation**: https://vitejs.dev

---

## Quick Reference

### Backend URLs
- Health Check: `https://your-backend.onrender.com/health`
- Auth Endpoint: `https://your-backend.onrender.com/auth/*`
- API Endpoints: `https://your-backend.onrender.com/api/*`

### Frontend URLs
- Production: `https://your-app.vercel.app`
- Preview: `https://your-app-git-branch.vercel.app`

### Important Files
- Backend Config: [render.yaml](render.yaml) (root directory)
- Backend App: [backend/app.py](backend/app.py)
- Backend Packages: [backend/routes/__init__.py](backend/routes/__init__.py), [backend/models/__init__.py](backend/models/__init__.py), etc.
- Frontend Config: [frontend/vercel.json](frontend/vercel.json)
- Frontend Build: [frontend/vite.config.ts](frontend/vite.config.ts)
- API Service: [frontend/src/services/api.ts](frontend/src/services/api.ts)

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
