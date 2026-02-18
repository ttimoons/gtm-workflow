# Quick Start Guide - Domain Scanner

## 🚀 First Time Setup

```bash
# 1. Install Python dependencies
cd backend
pip3 install -r requirements.txt
python3 -m playwright install chromium
cd ..

# 2. Install Node dependencies (if not done)
npm install
```

## ▶️ Start the App

**Option 1: One Command (Recommended)**
```bash
./start-dev.sh
```

**Option 2: Manual (Two Terminals)**
```bash
# Terminal 1 - Backend
cd backend && python3 app.py

# Terminal 2 - Frontend
npm run dev
```

**Servers:**
- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:5001

## 🔍 Scan a Website

1. Open http://localhost:5173
2. Click **"Scan Domain"** button (globe icon in toolbar)
3. Enter URL: `https://example.com`
4. Click **"Start Scan"**
5. Watch real-time logs
6. Review detected tags
7. Click **"Import Tags to Canvas"**

## 📋 What Gets Detected

- ✅ GTM Containers (`GTM-XXXX`)
- ✅ GA4 Properties (`G-XXXX`, `GT-XXXX`)
- ✅ Meta Pixel
- ✅ Google Ads (`AW-XXXX`)
- ✅ Hotjar
- ✅ Microsoft Clarity
- ✅ LinkedIn Insight Tag
- ✅ Twitter/X Pixel
- ✅ TikTok Pixel
- ✅ And 40+ more vendors...

## 🎯 Example Websites to Test

Good for testing:
- `https://www.google.com` (GTM + GA4)
- `https://www.facebook.com` (Meta Pixel)
- `https://www.shopify.com` (Multiple tags)
- `https://www.hubspot.com` (HubSpot + GTM)

## ❓ Troubleshooting

### Backend not starting?
```bash
# Check Python version (need 3.9+)
python3 --version

# Reinstall dependencies
cd backend
pip3 install -r requirements.txt --upgrade
```

### Frontend not starting?
```bash
# Make sure you're using nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Can't connect to backend?
```bash
# Test backend health
curl http://127.0.0.1:5001/health
# Should return: {"status":"ok"}
```

### Scan timeout?
- Some websites block automation (CAPTCHA)
- Try a simpler site first (e.g., google.com)
- Check backend logs for errors

## 📚 More Info

- **Full Guide**: See [SCANNER_INTEGRATION.md](./SCANNER_INTEGRATION.md)
- **Implementation**: See [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Backend API**: See [backend/README.md](./backend/README.md)

## 🛑 Stop Servers

If using `start-dev.sh`: Press `Ctrl+C`

If using manual terminals: Press `Ctrl+C` in both terminals

## ⚡ Quick Commands

```bash
# Start app
./start-dev.sh

# Check backend health
curl http://127.0.0.1:5001/health

# View backend logs (if running in background)
tail -f /path/to/backend/output.log

# Reinstall everything
cd backend && pip3 install -r requirements.txt && cd .. && npm install
```

---

**That's it!** You're ready to scan websites and import tags. 🎉
