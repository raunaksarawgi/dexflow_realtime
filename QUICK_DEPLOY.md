# 🚀 Quick Deployment Checklist

## Option A: Render + Upstash (Recommended)

### 1. Setup Upstash Redis (5 minutes)
```
✅ Go to: https://upstash.com/
✅ Sign up (use GitHub)
✅ Create Database:
   - Name: dexflow-realtime
   - Type: Regional
   - Region: us-east-1 (or closest to you)
   - TLS: Enable
✅ Copy connection URL (looks like):
   rediss://default:AbCd123...@us1-example.upstash.io:6379
```

### 2. Deploy to Render (5 minutes)
```
✅ Go to: https://render.com/
✅ New + → Web Service
✅ Connect GitHub repo: raunaksarawgi/dexflow_realtime
✅ Settings:
   - Name: dexflow-realtime
   - Region: Oregon (or same as Redis)
   - Build Command: npm install
   - Start Command: npm start
```

### 3. Add Environment Variables in Render
```
✅ Click "Environment" tab
✅ Add these variables:

NODE_ENV=production
PORT=3000
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
CACHE_TTL=30
API_CACHE_TTL=15
CORS_ORIGIN=*
WS_UPDATE_INTERVAL=30000
LOG_LEVEL=info
```

### 4. Deploy & Verify
```
✅ Click "Create Web Service"
✅ Wait 2-3 minutes for build
✅ Check logs for: "Redis connected successfully"
✅ Test: curl https://YOUR_APP.onrender.com/api/health
✅ Copy your URL: https://YOUR_APP.onrender.com
```

---

## Option B: Railway + Built-in Redis (Easiest)

### 1. Deploy to Railway (3 minutes)
```
✅ Go to: https://railway.app/
✅ New Project → Deploy from GitHub
✅ Select: raunaksarawgi/dexflow_realtime
```

### 2. Add Redis Plugin
```
✅ In project: New → Database → Add Redis
✅ REDIS_URL automatically created!
```

### 3. Add Other Environment Variables
```
✅ Click your web service → Variables
✅ Add:
   NODE_ENV=production
   CACHE_TTL=30
   API_CACHE_TTL=15
   CORS_ORIGIN=*
   LOG_LEVEL=info
```

### 4. Done!
```
✅ Railway auto-deploys
✅ Get URL from "Settings" → "Public Networking"
✅ Test: curl https://YOUR_APP.railway.app/api/health
```

---

## Troubleshooting

### ❌ "Redis connection error"
**Fix:**
1. Check REDIS_URL is set in Render environment variables
2. Make sure URL starts with `rediss://` (double s for TLS)
3. Verify Redis database is active in Upstash dashboard
4. Test connection: `redis-cli -u "YOUR_REDIS_URL" ping`

### ❌ "Build failed"
**Fix:**
1. Check package.json has `"postinstall": "npm run build"`
2. Verify all TypeScript files compile locally: `npm run build`
3. Check Render logs for specific error

### ❌ "Port already in use" (Render)
**Fix:**
- Render sets PORT automatically, no need to change

---

## After Deployment

### Update README with URL
```bash
# Add to README.md:
🌐 **Live Demo**: https://your-app.onrender.com

**API Endpoints**:
- Health: https://your-app.onrender.com/api/health
- Tokens: https://your-app.onrender.com/api/tokens
- Search: https://your-app.onrender.com/api/search?q=SOL
```

### Test WebSocket
```javascript
// In browser console:
const socket = io('https://your-app.onrender.com');
socket.on('connect', () => console.log('✅ Connected!'));
socket.on('initial_data', (data) => console.log('📦 Data:', data));
```

---

## Cost (Everything Free!)

| Service | Cost |
|---------|------|
| Render Web Service | Free (750 hrs/month) |
| Upstash Redis | Free (10K cmds/day) |
| **Total** | **$0/month** |

**Note**: Render free tier sleeps after 15 min of inactivity. First request wakes it up (~30-60 sec).

---

## Support

- **Full Guide**: See DEPLOYMENT.md
- **Upstash Docs**: https://docs.upstash.com/redis
- **Render Docs**: https://render.com/docs
- **Issues**: Check logs in Render dashboard

---

## Next Steps

- [ ] Deploy to Render with Upstash Redis
- [ ] Test all API endpoints
- [ ] Update README with deployed URL
- [ ] Create Postman collection
- [ ] Write unit tests (≥10 required)
- [ ] Record demo video
