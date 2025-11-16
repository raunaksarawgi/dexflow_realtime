# 🚀 Deployment Guide

## Redis Setup (Required for Production)

Redis is **mandatory** for this project. You need a Redis cloud service for production deployment.

### Option 1: Upstash Redis (Recommended - Free Tier)

**Upstash** provides a free Redis instance with 10,000 commands/day (sufficient for this project).

#### Step-by-Step Setup:

1. **Create Upstash Account**
   - Go to https://upstash.com/
   - Sign up with GitHub (easiest)

2. **Create Redis Database**
   - Click "Create Database"
   - Choose settings:
     - **Name**: `dexflow-realtime` (or any name)
     - **Type**: Regional (cheaper)
     - **Region**: Choose closest to your Render region (e.g., `us-east-1`)
     - **TLS**: Enable (recommended)
   - Click "Create"

3. **Get Connection Details**
   - After creation, you'll see your database dashboard
   - Copy the **connection string** that looks like:
     ```
     rediss://default:YOUR_PASSWORD@endpoint.upstash.io:6379
     ```
   - Note: `rediss://` (with double 's') means TLS/SSL enabled

4. **Add to Render Environment Variables**
   - In your Render dashboard → Your Web Service → Environment
   - Add this variable:
     ```
     REDIS_URL=rediss://default:YOUR_PASSWORD@endpoint.upstash.io:6379
     ```
   - Save and redeploy

---

### Option 2: Redis Cloud by Redis Labs (Free Tier)

Alternative free option with 30MB storage.

1. **Create Account**
   - Go to https://redis.com/try-free/
   - Sign up

2. **Create Database**
   - Choose "Fixed" plan (free)
   - Select region close to your Render deployment
   - Create database

3. **Get Connection Details**
   - Copy the connection string from dashboard
   - Format: `redis://default:password@host:port`

4. **Add to Render**
   - Add `REDIS_URL` environment variable
   - Redeploy

---

### Option 3: Railway Redis Plugin (If using Railway)

If you're deploying to Railway instead of Render:

1. **Add Redis Plugin**
   - In Railway project → New → Database → Add Redis
   - Railway automatically creates `REDIS_URL` environment variable
   - No configuration needed!

---

## Deploying to Render

### Prerequisites
- GitHub repository with your code
- Upstash Redis database created (see above)

### Step-by-Step Deployment:

1. **Create Web Service**
   - Go to https://render.com/
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **Name**: `dexflow-realtime` (or your choice)
   - **Region**: Choose same as Redis (e.g., Oregon, Ohio)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install` (postinstall will run build)
   - **Start Command**: `npm start`

3. **Set Environment Variables**
   
   Click "Environment" and add these variables:
   
   ```bash
   NODE_ENV=production
   PORT=3000
   
   # Redis (from Upstash)
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   
   # Cache Configuration
   CACHE_TTL=30
   API_CACHE_TTL=15
   
   # Rate Limiting
   RATE_LIMIT_PER_MINUTE=300
   RATE_LIMIT_WINDOW_MS=60000
   
   # CORS (set to your frontend URL or * for testing)
   CORS_ORIGIN=*
   
   # WebSocket Configuration
   WS_UPDATE_INTERVAL=30000
   
   # Logging
   LOG_LEVEL=info
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy
   - Wait 2-3 minutes for build to complete

5. **Verify Deployment**
   - Once deployed, you'll get a URL like: `https://dexflow-realtime.onrender.com`
   - Test the API:
     ```bash
     curl https://your-app.onrender.com/api/health
     ```
   - Check logs for Redis connection success:
     ```
     [INFO] Redis connected successfully
     [INFO] Server started successfully
     ```

---

## Deploying to Railway (Alternative)

Railway is simpler for Redis as it provides a built-in plugin.

1. **Create New Project**
   - Go to https://railway.app/
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Add Redis Plugin**
   - In your project → "New" → "Database" → "Add Redis"
   - Railway automatically sets `REDIS_URL` environment variable

3. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   CACHE_TTL=30
   API_CACHE_TTL=15
   CORS_ORIGIN=*
   WS_UPDATE_INTERVAL=30000
   LOG_LEVEL=info
   ```

4. **Deploy**
   - Railway auto-deploys on every git push
   - Get your URL from the dashboard

---

## Troubleshooting

### Issue: Redis Connection Failed

**Symptoms:**
```
[ERROR] Redis connection error
[WARN] Redis connection closed
[INFO] Redis reconnecting...
```

**Solutions:**

1. **Check REDIS_URL Format**
   - For TLS connections, use: `rediss://` (double 's')
   - For non-TLS: `redis://`
   - Example: `rediss://default:pass@host.upstash.io:6379`

2. **Verify Redis is Accessible**
   - Test connection with redis-cli:
     ```bash
     redis-cli -u "rediss://default:pass@host.upstash.io:6379" ping
     ```
   - Should return: `PONG`

3. **Check Environment Variables**
   - In Render dashboard, verify `REDIS_URL` is set
   - Click "Environment" tab to view/edit

4. **Network/Firewall Issues**
   - Upstash: No IP whitelist needed
   - Redis Cloud: May need to whitelist Render IPs

5. **Redis Credentials**
   - Double-check username/password
   - For Upstash, username is usually `default`

### Issue: Build Failed

**Solution:**
- Ensure `postinstall` script is in package.json
- Check build logs for TypeScript errors
- Verify all dependencies are in `dependencies` (not just `devDependencies`)

### Issue: App Crashes After Deploy

**Check Logs:**
```bash
# In Render dashboard, go to "Logs" tab
```

Common issues:
- Missing environment variables
- Port binding (Render sets PORT automatically)
- Redis connection timeout

---

## Performance Optimization for Production

### 1. Increase Cache TTL
For production, you might want longer cache times:
```bash
CACHE_TTL=60          # 1 minute (instead of 30s)
API_CACHE_TTL=30      # 30 seconds
```

### 2. Adjust WebSocket Update Interval
Match with cache TTL:
```bash
WS_UPDATE_INTERVAL=60000  # 60 seconds (in milliseconds)
```

### 3. Monitor Redis Usage
- Check Upstash dashboard for command count
- Free tier: 10,000 commands/day
- If exceeded, upgrade or optimize caching

### 4. Enable Logging
```bash
LOG_LEVEL=info  # Use 'debug' for troubleshooting, 'info' for production
```

---

## Cost Breakdown (Free Tier)

| Service | Plan | Limits | Cost |
|---------|------|--------|------|
| **Render** | Free | 750 hours/month, sleeps after 15 min inactivity | $0 |
| **Upstash Redis** | Free | 10,000 commands/day, 256 MB storage | $0 |
| **Railway** (alt) | Trial | $5 credit, then pay-as-you-go | ~$1-5/month |

**Note**: Render free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30-60 seconds to wake up.

---

## Upgrading Redis (If Needed)

If you hit Upstash free tier limits:

1. **Optimize First**
   - Increase `CACHE_TTL` to reduce Redis writes
   - Use `API_CACHE_TTL` for API-specific caching
   - Monitor usage in Upstash dashboard

2. **Upgrade Upstash**
   - Pay-as-you-go: $0.20 per 100K commands
   - Very affordable for most apps

3. **Alternative: Railway Redis**
   - Included in Railway usage
   - Pay-as-you-go based on memory

---

## Testing Production Deployment

Once deployed, test these endpoints:

```bash
# Replace with your actual URL
BASE_URL="https://your-app.onrender.com"

# Health check
curl "$BASE_URL/api/health"

# Get tokens
curl "$BASE_URL/api/tokens?limit=5"

# Search
curl "$BASE_URL/api/search?q=SOL"

# WebSocket (use browser or tool like wscat)
# Connect to: wss://your-app.onrender.com
```

### Test WebSocket in Browser Console:
```javascript
const socket = io('https://your-app.onrender.com');

socket.on('connect', () => {
  console.log('✅ Connected!');
});

socket.on('initial_data', (data) => {
  console.log('📦 Initial data:', data);
});

socket.on('tokens_updated', (data) => {
  console.log('🔄 Update:', data);
});
```

---

## Monitoring

### Render Logs
- Dashboard → Your Service → Logs
- Real-time log streaming
- Filter by log level

### Upstash Monitoring
- Dashboard → Your Database → Metrics
- Commands per second
- Latency
- Storage usage

### Custom Monitoring
Add this to check Redis status:
```bash
curl "$BASE_URL/api/health"
```

Response includes Redis connection status.

---

## Quick Setup Checklist

- [ ] Create Upstash account
- [ ] Create Redis database in Upstash
- [ ] Copy Redis connection URL
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Add `REDIS_URL` environment variable in Render
- [ ] Add other environment variables
- [ ] Deploy
- [ ] Test API endpoints
- [ ] Test WebSocket connection
- [ ] Add deployment URL to README

---

## Support & Resources

- **Upstash Docs**: https://docs.upstash.com/redis
- **Render Docs**: https://render.com/docs
- **Redis Connection Issues**: Check DEPLOYMENT.md troubleshooting section
- **WebSocket Testing**: Use demo/test-client.html

---

**Next Steps After Deployment:**
1. Update README.md with your deployed URL
2. Create Postman collection with production endpoints
3. Record demo video showing deployed app
4. Write tests (required deliverable)
