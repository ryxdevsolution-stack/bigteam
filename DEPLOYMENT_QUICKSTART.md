# BigTeam Deployment Quick Start

Fast track guide to deploy BigTeam in under 15 minutes.

## Prerequisites Checklist

- [ ] Git repository pushed to GitHub/GitLab
- [ ] Render account created
- [ ] Vercel account created
- [ ] Supabase database ready
- [ ] Database credentials available

---

## Step 1: Deploy Backend to Render (5 minutes)

### 1.1 Create Service
1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect repository → Select BigTeam repo

### 1.2 Configure
```
Name: bigteam-backend
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app
```

### 1.3 Add Environment Variables
```bash
FLASK_ENV=production
DB_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-service-role-key
JWT_SECRET_KEY=generate-random-secret
FRONTEND_URL=https://your-app.vercel.app  # Update after frontend deploy
```

### 1.4 Deploy
- Click **Create Web Service**
- Wait 5-10 minutes
- **Copy backend URL**: `https://your-backend.onrender.com`

### 1.5 Verify
```bash
curl https://your-backend.onrender.com/health
# Should return: {"status": "healthy", "environment": "production"}
```

✅ Backend deployed!

---

## Step 2: Deploy Frontend to Vercel (5 minutes)

### 2.1 Import Project
1. Go to https://vercel.com/dashboard
2. Click **Add New...** → **Project**
3. Import BigTeam repository

### 2.2 Configure
```
Project Name: bigteam-frontend
Framework: Vite (auto-detected)
Root Directory: frontend
Build Command: npm run build (auto-detected)
Output Directory: dist (auto-detected)
```

### 2.3 Add Environment Variable
```
VITE_API_URL=https://your-backend.onrender.com
```
⚠️ **Use your actual Render backend URL from Step 1.4**

### 2.4 Deploy
- Click **Deploy**
- Wait 2-5 minutes
- **Copy frontend URL**: `https://your-app.vercel.app`

✅ Frontend deployed!

---

## Step 3: Update Backend CORS (2 minutes)

### 3.1 Update Render Environment
1. Go back to Render Dashboard
2. Your Service → **Environment**
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
   ⚠️ **Use your actual Vercel URL from Step 2.4**
4. Click **Save Changes**
5. Render will auto-redeploy (2-3 minutes)

✅ CORS configured!

---

## Step 4: Verify Everything Works (3 minutes)

### 4.1 Test Backend
```bash
# Health check
curl https://your-backend.onrender.com/health

# Should return:
# {"status": "healthy", "environment": "production"}
```

### 4.2 Test Frontend
1. Open `https://your-app.vercel.app`
2. Try to register a new account
3. Try to login
4. Check browser console for errors

### 4.3 Check CORS
- Open browser Developer Tools
- Go to Console tab
- Verify no CORS errors
- Check Network tab - API calls should succeed

✅ **Deployment Complete!**

---

## Production URLs

Save these for your records:

```
Backend API: https://your-backend.onrender.com
Frontend App: https://your-app.vercel.app
Health Check: https://your-backend.onrender.com/health
```

---

## Troubleshooting

### Issue: "Cannot connect to API"
**Solution**:
- Verify `VITE_API_URL` in Vercel matches Render backend URL
- Redeploy frontend if needed

### Issue: "CORS error"
**Solution**:
- Verify `FRONTEND_URL` in Render matches Vercel frontend URL
- Wait for Render to redeploy (check Render dashboard)

### Issue: "Backend not responding"
**Solution**:
- Check Render logs for errors
- Verify all environment variables are set
- Check database connection

### Issue: "Frontend shows blank page"
**Solution**:
- Check Vercel build logs
- Verify `VITE_API_URL` is set
- Check browser console for JavaScript errors

---

## Next Steps

1. **Custom Domain**: Add your own domain in Render/Vercel settings
2. **Database Setup**: Run migrations if needed
3. **Monitoring**: Set up alerts in Render dashboard
4. **Analytics**: Enable Vercel analytics
5. **SSL**: Already enabled by default on both platforms

---

## Auto-Deploy Setup

✅ **Already configured!** Both platforms auto-deploy on git push:

- **Render**: Deploys on push to `main` branch
- **Vercel**: Deploys production on `main`, creates previews for other branches

Just push to Git and deployments happen automatically!

---

## Important Files Reference

| File | Purpose |
|------|---------|
| [render.yaml](render.yaml) | Render configuration (root directory) |
| [backend/app.py](backend/app.py) | Flask app with CORS |
| [backend/requirements.txt](backend/requirements.txt) | Python dependencies |
| [backend/routes/__init__.py](backend/routes/__init__.py) | Python package init files |
| [frontend/vercel.json](frontend/vercel.json) | Vercel configuration |
| [frontend/vite.config.ts](frontend/vite.config.ts) | Vite build config |
| [frontend/src/services/api.ts](frontend/src/services/api.ts) | API client |

---

## Support

- Full documentation: [DEPLOYMENT.md](DEPLOYMENT.md)
- Render docs: https://render.com/docs
- Vercel docs: https://vercel.com/docs

---

**Estimated Total Time**: 15 minutes
**Last Updated**: 2025-11-14
