# Troubleshooting Guide

## Issues Fixed

### 1. ✅ MongoDB Connection Timeouts

**Problem**: Cron jobs were failing with `ETIMEDOUT` errors when trying to connect to MongoDB Atlas.

**Root Cause**: 
- Network instability or firewall blocking MongoDB Atlas connection
- MongoDB Atlas connection pool exhaustion
- No retry logic for failed connections

**Solutions Implemented**:
1. **Added Retry Logic**: Server now automatically retries MongoDB connection every 5 seconds if it fails
2. **Connection Options**: 
   - `serverSelectionTimeoutMS: 10000` - Wait 10s for server selection
   - `socketTimeoutMS: 45000` - Keep socket open for 45s
   - `maxPoolSize: 10` - Limit connection pool
   - `retryWrites: true` - Auto-retry failed writes
3. **Connection Monitoring**: Server logs connection events (disconnected, error, reconnected)
4. **Cron Job Protection**: Jobs now check MongoDB connection status before running
   - If `mongoose.connection.readyState !== 1`, job is skipped
   - Network errors are logged but don't crash the service

**What You'll See Now**:
- ✅ MongoDB Connected successfully
- ⚠️ MongoDB disconnected. Attempting to reconnect...
- 🔄 Retrying connection in 5 seconds...
- ⚠️ Skipping [job name] - MongoDB not connected

### 2. ✅ CORS Errors

**Problem**: Server blocking requests from frontend with "Not allowed by CORS" error.

**Root Cause**: 
- Origin mismatch between frontend URL and allowed origins
- Missing or incorrect `FRONTEND_URL` in environment variables

**Solutions Implemented**:
1. **Enhanced Logging**: CORS errors now show which origin was blocked
2. **Better Error Messages**: Includes list of allowed origins
3. **Added `optionsSuccessStatus: 200`**: Better handling of preflight requests

**To Debug CORS Issues**:
1. Check your `.env` file in backend:
   ```env
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```

2. Look for CORS logs in terminal:
   ```
   ⚠️ CORS blocked request from: http://localhost:XXXX
   Allowed origins: http://localhost:5173, http://localhost:5174, http://localhost:5175
   ```

3. **In Development**: Server allows ports 5173, 5174, 5175
4. **In Production**: Only the `FRONTEND_URL` is allowed unless `ALLOW_LOCALHOST_IN_PROD=true`

**Quick Fixes**:
- Ensure your frontend is running on port 5173, 5174, or 5175
- OR add your port to `allowedOrigins` array in `server.js`
- For production, set `FRONTEND_URL` environment variable and redeploy

---

## Additional Recommendations

### For MongoDB Connection Issues:

1. **Check Network/Firewall**:
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Check if firewall/antivirus is blocking port 27017
   - Try connecting from MongoDB Compass to verify connectivity

2. **MongoDB Atlas Settings**:
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add your current IP address
   - Or allow access from anywhere (0.0.0.0/0) for testing

3. **Connection String**:
   - Verify `MONGO_URI` in `.env` is correct
   - Should look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

4. **Reduce Cron Frequency** (if issues persist):
   In `cronJobs.js` and `paymentTimeout.js`:
   - Change `'*/5 * * * *'` to `'*/10 * * * *'` (every 10 minutes)
   - Change `'* * * * *'` to `'*/2 * * * *'` (every 2 minutes)

### For CORS Issues:

1. **Development Setup**:
   ```bash
   # Backend .env
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   
   # Frontend should run on
   npm run dev  # Usually starts on 5173
   ```

2. **Production Setup**:
   ```bash
   # Backend .env
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Testing with Postman/Thunder Client**:
   - These tools don't send an `origin` header
   - Server allows requests without origin (for API testing)

---

## Monitoring Your Server

### Healthy Server Logs Should Show:
```
✅ MongoDB Connected successfully
Cron jobs started
Payment timeout job started - checking every minute
Server is running on port 5000
```

### Warning Signs:
```
⚠️ MongoDB disconnected. Attempting to reconnect...
⚠️ Skipping [job name] - MongoDB not connected
⚠️ CORS blocked request from: [origin]
```

### Error Signs:
```
❌ MongoDB Connection Error: [error]
🔄 Retrying connection in 5 seconds...
```

---

## Environment Variables Checklist

Ensure your `backend/.env` has:
```env
# MongoDB
MONGO_URI=mongodb+srv://...

# Server
PORT=5000
NODE_ENV=development  # or 'production'
FRONTEND_URL=http://localhost:5173
ALLOW_LOCALHOST_IN_PROD=true

# JWT
JWT_SECRET=your_secret_here

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Quick Restart Procedure

If you see persistent errors:

1. **Stop Server**: `Ctrl + C` in terminal
2. **Check MongoDB Atlas**: Verify IP whitelist and cluster status
3. **Check `.env`**: Verify all variables are set
4. **Restart Server**: `npm run dev`
5. **Monitor Logs**: Watch for connection success messages

---

## Still Having Issues?

1. **Check MongoDB Atlas Status**: https://status.mongodb.com/
2. **Test MongoDB Connection**: Use MongoDB Compass with your connection string
3. **Check Node Version**: Ensure you're using Node.js v16 or higher
4. **Clear Node Modules**: 
   ```bash
   rm -rf node_modules
   npm install
   ```
5. **Check Firewall/VPN**: Sometimes corporate firewalls or VPNs block MongoDB connections

---

## Temporary Workarounds

### Disable Cron Jobs (for testing):
In `server.js`, comment out:
```javascript
// startCronJobs();
// startPaymentTimeoutJob();
```

### Simplify CORS (for testing only - NOT for production):
In `server.js`:
```javascript
const corsOptions = {
    origin: '*',  // Allow all origins (TESTING ONLY!)
    credentials: true,
};
```

---

Last Updated: February 12, 2026
