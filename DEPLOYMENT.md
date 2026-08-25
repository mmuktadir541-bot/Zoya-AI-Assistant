# Deployment Guide for Zoya AI Assistant 🚀

## Overview

This guide covers deploying Zoya AI Assistant to production environments.

## Prerequisites

- Node.js 18+
- Google Gemini API Key
- Git
- npm or yarn

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Gemini API key
echo "REACT_APP_GEMINI_API_KEY=your_api_key_here" >> .env

# Start dev server
npm run dev
```

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment Options

### 1. Vercel (Recommended)

**Advantages:**
- Zero-config deployment
- Automatic HTTPS
- Environment variable management
- Free tier available

**Steps:**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your GitHub repository
5. Add environment variables:
   - `REACT_APP_GEMINI_API_KEY`: Your Gemini API key
6. Click Deploy

```bash
# Or deploy via CLI
npm install -g vercel
vercel
```

### 2. Netlify

**Steps:**
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Site settings
5. Deploy

```bash
# Or deploy via CLI
npm install -g netlify-cli
netlify deploy --prod
```

### 3. GitHub Pages

**Note:** GitHub Pages doesn't support environment variables directly. Use secrets or manual deployment.

```bash
# Build
npm run build

# Deploy
git add dist/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### 4. Self-Hosted (VPS/Docker)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

**Deploy:**
```bash
# Build image
docker build -t zoya-ai .

# Run container
docker run -p 3000:3000 -e REACT_APP_GEMINI_API_KEY=your_key zoya-ai
```

## Environment Variables

**Required:**
- `REACT_APP_GEMINI_API_KEY`: Google Gemini API key

**Optional:**
- `VITE_API_URL`: Custom API endpoint
- `VITE_LOG_LEVEL`: Debug logging level

## Performance Optimization

1. **Code Splitting:**
   ```bash
   npm run build -- --mode production
   ```

2. **Lazy Loading:**
   Already implemented in React components

3. **Caching:**
   - Use service workers for offline support
   - Cache static assets

## Security Best Practices

1. **API Key Protection:**
   - Never commit `.env` files
   - Use environment variable management
   - Rotate keys regularly

2. **HTTPS Only:**
   - Enforce HTTPS in production
   - Use secure WebSocket (WSS)

3. **CORS Configuration:**
   - Restrict to your domain
   - Validate requests

4. **Rate Limiting:**
   - Implement on your backend
   - Prevent API abuse

## Monitoring & Logging

```javascript
// Add error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_sentry_dsn",
  environment: process.env.NODE_ENV,
});
```

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Key Not Working
- Verify key is correct
- Check API quota
- Ensure CORS is configured
- Test with curl:
  ```bash
  curl -H "x-goog-api-key: YOUR_KEY" \
    https://generativelanguage.googleapis.com/v1beta/models
  ```

### Microphone Permission Issues
- Ensure HTTPS in production
- Check browser permissions
- Allow localhost for development

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Support

For deployment issues:
1. Check error logs
2. Review platform documentation
3. Open GitHub issue
4. Contact support team

---

**Happy Deploying! 🎉**
