# Netlify Deployment Guide - Aorata

## Step-by-Step Instructions

### 1. Prepare Your GitHub Repository

```bash
cd /workspaces/Aorata
git add .
git commit -m "Aorata - Minecraft Server Hosting Platform"
git push origin main
```

### 2. Sign Up for Netlify

1. Go to https://netlify.com
2. Click "Sign up"
3. Choose "GitHub" 
4. Authorize Netlify to access your GitHub account

### 3. Create New Site from Git

1. Click "New site from Git"
2. Select "GitHub"
3. Find and select your "Aorata" repository
4. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm install && npm start`
   - **Publish directory**: `public`

### 4. Set Environment Variables

Before deploying:

1. Go to **Site Settings** → **Build & Deploy** → **Environment**
2. Add these variables:
   ```
   PORT=3000
   NODE_ENV=production
   ```

### 5. Deploy!

1. Click **"Deploy site"**
2. Wait for build to complete (2-3 minutes)
3. Your site is live! 🎉

### 6. Custom Domain (Optional)

1. Go to **Site Settings** → **Domain Settings**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `aorata.io`)
4. Follow DNS configuration steps

---

## File Structure for Netlify

```
Aorata/
├── index.html              ✅ Homepage
├── server.js               ✅ Express server
├── package.json            ✅ Dependencies
├── netlify.toml            ✅ Netlify config
├── .env.example            ✅ Environment template
├── DEPLOYMENT.md           ✅ This guide
├── public/
│   ├── dashboard.html      ✅ Dashboard UI
│   ├── dashboard.js        ✅ Dashboard logic
│   └── style.css           ✅ Styles
├── servers/                (Created at runtime)
└── node_modules/           (Installed by npm)
```

---

## What's Configured

### netlify.toml

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This tells Netlify to:
- Run `npm start` to build
- Serve files from `public/` directory
- Redirect all routes to index.html (SPA support)

---

## API Configuration

### For Netlify Serverless Functions

If you want to use Netlify Functions instead of Express:

1. Create `/netlify/functions/servers.js`
2. Move API logic there
3. Update dashboard.js API calls to point to `/api/`

### Current Setup

Currently using Express on Node.js with these endpoints:
- `GET /api/servers` - List servers
- `POST /api/servers` - Create server
- `POST /api/servers/:id/start` - Start server
- `POST /api/servers/:id/stop` - Stop server

---

## Download Files Checklist

Before deploying, ensure you have:

- ✅ `package.json` - Dependencies list
- ✅ `server.js` - Main server
- ✅ `index.html` - Homepage
- ✅ `public/dashboard.html` - Dashboard
- ✅ `public/dashboard.js` - Dashboard logic
- ✅ `netlify.toml` - Netlify config
- ✅ `.env.example` - Environment template
- ✅ `README.md` - Documentation

---

## Troubleshooting

### Build Fails
```
Check: Netlify Dashboard → Site Settings → Deploys → Build logs
```

### API Not Working
```
Check: Browser Console → Network tab → /api/* requests
```

### Port Issues
```
Netlify uses port 443 (HTTPS)
Express should run on process.env.PORT or 3000
```

---

## Quick Deploy Commands

### From your local machine:

```bash
# Install dependencies
npm install

# Test locally
npm start

# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Ready for Netlify"
git push origin main
```

---

## Site Settings to Check

After deployment, verify:

1. **Build Settings**
   - Build command: `npm start`
   - Publish directory: `public`

2. **Environment Variables**
   - `PORT=3000`
   - `NODE_ENV=production`

3. **Domain Settings**
   - DNS configured (if custom domain)

4. **Build Logs**
   - No errors shown
   - Latest deploy successful

---

## Your Deployment URL

After deployment, your site will be available at:

```
https://your-site-name.netlify.app
```

(Replace with actual Netlify URL after deployment)

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect Netlify
3. ✅ Configure environment variables
4. ✅ Deploy
5. ✅ Test dashboard at `/public/dashboard.html`
6. ✅ Create your first server
7. ✅ Share with friends!

---

**Need help?** Check the logs or contact Netlify support at https://support.netlify.com

© 2026 AORATA HOSTING
