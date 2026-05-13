# Deployment Guide for Vercel + Backend Service

## Problem
Vercel doesn't support long-running WebSocket servers because it's a serverless platform. You need to deploy the backend separately.

## Solution: Vercel (Frontend) + Render/Railway/Heroku (Backend)

### Step 1: Deploy Frontend to Vercel

1. Make sure your code is pushed to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New" → "Project"
4. Select your `tic-tac-toe` repository
5. Click "Deploy"
6. Wait for deployment to complete (you'll get a URL like `https://tic-tac-toe-xxx.vercel.app`)

### Step 2: Deploy Backend to Render (Recommended)

Render.com is free and supports WebSockets perfectly.

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub account
4. Select your `tic-tac-toe` repository
5. Fill in the settings:
   - **Name**: `tic-tac-toe-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Region**: (choose closest to you)
6. Click "Create Web Service"
7. Wait for deployment (this takes 2-3 minutes)

**Important:** The free tier on Render spins down after 15 minutes of inactivity. You can upgrade to prevent this.

### Step 3: Get Your Backend URL

After Render finishes deploying:
1. You'll see a URL like `https://tic-tac-toe-server.onrender.com`
2. Copy this URL
3. Your WebSocket URL is: `wss://tic-tac-toe-server.onrender.com`

### Step 4: Configure Frontend with Backend URL

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add a new environment variable:
   - **Name**: `REACT_APP_WS_URL`
   - **Value**: `wss://tic-tac-toe-server.onrender.com` (use your actual Render URL)
4. Click "Save"
5. Go to "Deployments" and click "Redeploy" on the latest deployment
6. Wait for redeploy to complete

### Step 5: Test It

1. Go to your Vercel app URL
2. Click "Create New Room"
3. If you see an error, check:
   - Browser console (F12 → Console tab) for detailed error
   - Render service is still running (check Render dashboard)
   - WebSocket URL is correct in environment variables

## Alternative: Deploy Backend to Heroku

Heroku is also free but has some limitations:

1. Create a [Heroku](https://heroku.com) account
2. Install Heroku CLI: `npm install -g heroku`
3. In your project directory:
   ```bash
   heroku login
   heroku create tic-tac-toe-server
   git push heroku main
   ```
4. Get your app URL from Heroku dashboard (format: `https://tic-tac-toe-server.herokuapp.com`)
5. WebSocket URL: `wss://tic-tac-toe-server.herokuapp.com`
6. Set this in Vercel environment variables

## Alternative: Deploy Backend to Railway

Railway is also excellent and has a generous free tier:

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Railway auto-detects Node.js setup
5. Wait for deployment
6. Get your domain from Railway dashboard
7. WebSocket URL: `wss://your-domain.railway.app`
8. Set this in Vercel environment variables

## Testing the Connection

1. Open your Vercel app
2. Open browser DevTools (F12)
3. Go to Console tab
4. You should see "Connecting to WebSocket at: wss://..."
5. If successful, you'll see "Connected to server"
6. If you see an error, the backend URL might be wrong

## Common Issues

### "Connection error. Make sure the backend server is running."

**Causes:**
- Backend isn't deployed
- Backend URL in environment variable is wrong
- Backend service crashed

**Fix:**
1. Check your Render/Railway/Heroku dashboard - is the service running?
2. Verify `REACT_APP_WS_URL` in Vercel settings is correct
3. Redeploy your Vercel app
4. Try refreshing the browser

### "Room not found" after creating room

- This usually means the backend isn't connected
- Check the browser console for WebSocket errors
- Make sure backend is running on Render/Railway/Heroku

### Still having issues?

1. Check Render logs: Go to Render dashboard → Click your service → Logs tab
2. Check browser console: F12 → Console (look for WebSocket connection URL)
3. Try redeploying both frontend and backend
4. Clear browser cache and reload

## Quick Reference

| Service | Free Tier | Startup Time | Notes |
|---------|-----------|--------------|-------|
| Render | Yes (spins down after 15min inactivity) | 2-3 min | Recommended - best WebSocket support |
| Railway | Yes (100 hours/month) | ~30 sec | Great alternative |
| Heroku | No | N/A | Paid only now |
| Vercel | Yes | Instant | Frontend only |

## Keeping Services Running

### Render
Upgrade to paid plan ($7/month) to keep service always running.

### Railway
Free tier gives 100 hours per month - enough for a few hours daily.

### Alternative: Use a cron service
You can use free cron services to ping your backend every 10 minutes to keep it awake.

## Final Verification

Once everything is deployed:
1. Your Vercel URL should show the tic-tac-toe game
2. Clicking "Create Room" should work
3. You can test with two browser windows on the same computer
4. Or share your Vercel URL with a friend to play together

Good luck! 🎮
