# PrimusInsights Roofing - Render Deployment Checklist

## Pre-Deployment Checklist

### 1. GitHub Repository Setup
- [x] Repository created on GitHub: `primus-insights-roofing`
- [x] Local git initialized (`git init`)
- [x] All files committed (`git add .` && `git commit`)
- [x] Remote added: `git remote add origin https://github.com/NowItsMonopoly1/primus-insights-roofing.git`
- [x] Code pushed: `git push -u origin main`

### 2. Environment Variables Preparation

Required environment variables for Render:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE=+18555573967
OPENAI_API_KEY=your_openai_api_key_here
OWNER_PHONE=+1your_verified_number
CALENDAR_ID=primary
GOOGLE_CREDS=PLACEHOLDER
PORT=10000
```

**IMPORTANT NOTES:**
- `TWILIO_AUTH_TOKEN`: Use the current active token
- `OPENAI_API_KEY`: Your actual OpenAI API key (starts with `sk-`)
- `OWNER_PHONE`: Must be verified in Twilio (trial account limitation)
- `PORT`: Must be `10000` for Render
- `GOOGLE_CREDS`: Set to PLACEHOLDER for now (Google Calendar integration will be configured later)

### 3. Twilio Configuration Checklist

Before deployment:
- [x] Twilio account is active
- [x] Phone number `+18555573967` is verified and active
- [ ] Auth token has been regenerated (if previously exposed)
- [ ] `OWNER_PHONE` number is verified in Twilio Console
  - Navigate to: Phone Numbers → Verified Caller IDs
  - Add your number and complete verification

After deployment:
- [ ] Copy your Render URL: `https://YOUR-APP-NAME.onrender.com`
- [ ] Configure Twilio webhook:
  - Go to: Twilio Console → Phone Numbers → Manage → Active Numbers
  - Click on: `+18555573967`
  - Scroll to: "Messaging" section
  - Set "A MESSAGE COMES IN" to:
    `https://your-render-url.onrender.com/sms`
  - HTTP Method: POST
  - Save

### 4. Render Deployment Steps
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub account and select the `primus-insights-roofing` repo
4. Configure:
   - **Name**: `primus-insights-roofing`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables (exact names):
   ```
   TWILIO_ACCOUNT_SID=AC999a5b434a1dfc797b249eeaba388845
   TWILIO_AUTH_TOKEN=01bc5d22c7cb2f1ad90b3e14fa96f53a
   TWILIO_PHONE=+18555573967
   OPENAI_API_KEY=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
   OWNER_PHONE=+14153740024
   CALENDAR_ID=primary
   GOOGLE_CREDS=PLACEHOLDER
   PORT=10000
   ```
6. Set **Instance Type** to **Free**
7. Disable **Auto Deploy** (for MVP control)
8. Click **"Create Web Service"**
9. Wait for deployment (2-5 minutes)

### 5. Testing Your Deployment
Use your verified number for testing:

```bash
curl -X POST "https://your-render-url.onrender.com/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14153740024",
    "name": "Donte",
    "message": "I need a roof inspection"
  }'
```

**Expected Results:**
- ✅ Instant AI reply to your phone
- ✅ Qualifying question
- ✅ Booking sequence if qualified
- ✅ Owner alert SMS

## Troubleshooting Common Issues
- **401 Unauthorized**: Check Twilio credentials are current
- **OpenAI errors**: Verify API key is valid and has credits
- **Webhook not working**: Confirm Render URL is correct and webhook is set to POST
- **No SMS received**: Ensure phone number is verified in Twilio

## Post-Deployment Verification
1. Check Render logs for any startup errors
2. Test the `/lead` endpoint with curl
3. Send a test SMS to your Twilio number and check webhook response
4. Verify owner alerts are received

## What's Next?
Once you have:
- ✅ GitHub repo URL
- ✅ Regenerated Twilio auth token
- ✅ OpenAI API key
- ✅ Verified phone number

You can proceed with the Render deployment. The system will be live and ready to demo!
