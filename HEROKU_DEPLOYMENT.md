# Heroku Deployment Guide voor Motordash

## Prerequisites

1. **Heroku CLI** geïnstalleerd
2. **Git repository** geïnitialiseerd
3. **Firebase project** geconfigureerd
4. **Shopify store** toegang (optioneel)

## Stap 1: Heroku App Aanmaken

```bash
# Login naar Heroku
heroku login

# Maak een nieuwe app aan (vervang 'your-app-name' met je gewenste naam)
heroku create your-app-name

# Voeg Node.js buildpack toe
heroku buildpacks:set heroku/nodejs
```

## Stap 2: Environment Variables Configureren

### Firebase Configuration

```bash
# Kopieer de inhoud van je firebase-key.json bestand
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}' --app your-app-name

# Andere Firebase variabelen (voor de frontend)
heroku config:set VITE_FIREBASE_API_KEY="your-api-key" --app your-app-name
heroku config:set VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" --app your-app-name
heroku config:set VITE_FIREBASE_PROJECT_ID="your-project-id" --app your-app-name
heroku config:set VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app" --app your-app-name
heroku config:set VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" --app your-app-name
heroku config:set VITE_FIREBASE_APP_ID="your-app-id" --app your-app-name
```

### App Configuration

```bash
# App configuratie
heroku config:set NODE_ENV="production" --app your-app-name
heroku config:set FRONTEND_URL="https://your-app-name.herokuapp.com" --app your-app-name
```

### Shopify Configuration (optioneel)

```bash
heroku config:set SHOPIFY_STORE_NAME="your-store-name" --app your-app-name
heroku config:set SHOPIFY_ACCESS_TOKEN="your-access-token" --app your-app-name
```

## Stap 3: Deploy naar Heroku

```bash
# Voeg bestanden toe aan git
git add .
git commit -m "Heroku deployment setup"

# Deploy naar Heroku
git push heroku main

# Bekijk logs
heroku logs --tail --app your-app-name
```

## Stap 4: Database Initialisatie (optioneel)

Als je de forum database wilt initialiseren:

```bash
# Run database initialization script
heroku run npm run init-forum --app your-app-name
```

## Project Structure voor Heroku

```
app/
├── package.json          # Root package.json voor Heroku build
├── Procfile              # Heroku proces definitie
├── .env.example          # Environment variables template
├── backend/              # Node.js/Express backend
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
│   └── public/           # Static files (built frontend)
└── frontend/             # Vue.js frontend
    ├── package.json      # Frontend dependencies
    └── dist/             # Built frontend (created during build)
```

## Build Process

Heroku voert automatisch de volgende stappen uit:

1. **Install Dependencies**: `npm run install-deps`
2. **Build Frontend**: `npm run build-frontend`
3. **Start Server**: `npm start`

## Troubleshooting

### Build Errors

```bash
# Bekijk build logs
heroku logs --tail --app your-app-name

# Restart app
heroku restart --app your-app-name
```

### Environment Variables Check

```bash
# Bekijk alle config vars
heroku config --app your-app-name
```

### Database Connection Issues

Zorg ervoor dat je Firebase service account key correct is geconfigureerd als environment variable.

## Post-Deployment Checklist

- [ ] App opent correct in browser
- [ ] API endpoints werken (`/api/health`)
- [ ] Authentication werkt (Firebase)
- [ ] File uploads werken (Firebase Storage)
- [ ] Forum functionaliteit werkt
- [ ] CORS configuratie is correct

## Updates Deployen

```bash
# Maak wijzigingen
git add .
git commit -m "Update beschrijving"

# Deploy update
git push heroku main
```

## Handige Heroku Commands

```bash
# Open app in browser
heroku open --app your-app-name

# Bekijk logs
heroku logs --tail --app your-app-name

# Restart app
heroku restart --app your-app-name

# Scale dynos
heroku ps:scale web=1 --app your-app-name

# Run one-off command
heroku run node backend/scripts/init-db.js --app your-app-name
```
