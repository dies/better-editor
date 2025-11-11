# Deployment Guide

## 🚀 GitHub Pages Deployment

This app is a **static PWA** - perfect for GitHub Pages!

### Quick Deploy

```bash
# 1. Make sure you have a GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/better-editor.git

# 2. Push your code
git add .
git commit -m "Initial commit"
git push -u origin main

# 3. Deploy to GitHub Pages
npm run deploy
```

Done! Your app will be live at: `https://YOUR_USERNAME.github.io/better-editor/`

### First-Time Setup

1. **Create GitHub repository**
   ```bash
   # On GitHub, create a new repository called "better-editor"
   # Then:
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/better-editor.git
   git push -u origin main
   ```

2. **Deploy**
   ```bash
   npm install  # Install gh-pages if needed
   npm run deploy
   ```

3. **Configure GitHub Pages**
   - Go to your repo → Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / root
   - Click Save

4. **Wait a minute** - Your app will be live at:
   ```
   https://YOUR_USERNAME.github.io/better-editor/
   ```

### Update Deployment

Every time you make changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
npm run deploy
```

## 🔧 Custom Domain (Optional)

### Set up custom domain:

1. **Buy a domain** (e.g., from Namecheap, Google Domains)

2. **Add CNAME file**
   ```bash
   echo "your-domain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   npm run deploy
   ```

3. **Configure DNS** at your domain provider:
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
          185.199.109.153
          185.199.110.153
          185.199.111.153
   
   Type: CNAME
   Host: www
   Value: YOUR_USERNAME.github.io
   ```

4. **Enable HTTPS** in GitHub Pages settings

## 🌐 Other Hosting Options

### Netlify (Easiest)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Then drag & drop your folder to Netlify dashboard.

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Cloudflare Pages

1. Go to Cloudflare Pages dashboard
2. Connect your GitHub repo
3. Build settings:
   - Build command: (leave empty)
   - Output directory: /
4. Deploy

## 📱 PWA Installation

Once deployed, users can:

**Desktop:**
1. Visit your site
2. Click install icon in browser
3. App installs like native software

**Mobile:**
1. Visit in Safari (iOS) or Chrome (Android)
2. Tap Share → Add to Home Screen
3. App appears on home screen

## 🔒 Environment Variables

**Important:** This app stores API keys in browser localStorage.
- Keys never leave the user's browser
- No server-side storage needed
- Each user brings their own OpenAI key

## ✅ Deployment Checklist

- [ ] Update manifest.json with your domain
- [ ] Test PWA on mobile
- [ ] Verify file handlers work
- [ ] Check service worker caching
- [ ] Test offline mode
- [ ] Verify API key storage
- [ ] Check HTTPS is enabled

## 🐛 Troubleshooting

**"404 on GitHub Pages"**
- Wait 2-5 minutes after first deploy
- Check gh-pages branch exists
- Verify Pages is enabled in repo settings

**"PWA not installing"**
- Must use HTTPS (GitHub Pages has this)
- Check manifest.json is valid
- Verify service worker is registered

**"File handlers not working"**
- Only works when installed as PWA
- Test on Chrome/Edge (best support)
- Check manifest.json file_handlers section

## 📊 Analytics (Optional)

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

## 🔄 Auto-Deploy with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run deploy
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Now every push to main auto-deploys! 🎉

