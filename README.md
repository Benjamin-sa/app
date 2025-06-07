# Motordash - Motorcycle Community Platform

Dit is een full-stack webapplicatie voor motorliefhebbers, met een communityforum, een productcatalogus en gebruikersprofielen. Het project is gebouwd met een moderne architectuur, waarbij een Vue 3 frontend wordt gescheiden van een robuuste Node.js backend.

## 🏗️ Architectuur

De applicatie is verdeeld in twee hoofddelen:

- **`frontend/`**: Een moderne Vue 3-applicatie gebouwd met Vite. Het is verantwoordelijk voor alle gebruikersinteractie en de weergave van data.
- **`backend/`**: Een Node.js API gebouwd met Express. Het beheert de bedrijfslogica, database-interacties en communicatie met externe services.

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database & Authenticatie**: Firebase (Firestore, Auth, Storage)
- **E-commerce**: Shopify GraphQL API
- **Beeldverwerking**: Sharp
- **File Uploads**: Multer
- **Caching**: In-memory caching met `node-cache`

### Frontend

- **Framework**: Vue 3 (met Composition API en `<script setup>`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI-componenten**: Headless UI en Heroicons

## 🚀 Quick Start

### Backend Setup

1.  **Navigeer naar de backend-map**
    ```bash
    cd backend
    ```
2.  **Installeer de dependencies**
    ```bash
    npm install
    ```
3.  **Omgevingsvariabelen configureren**
    Maak een `.env`-bestand in de `backend`-map en vul de vereiste variabelen in (zie `backend/config/` voor de benodigde keys).
4.  **Start de development server**
    ```bash
    npm run dev
    ```
    De API is nu beschikbaar op `http://localhost:3000`.

### Frontend Setup

1.  **Navigeer naar de frontend-map**
    ```bash
    cd frontend
    ```
2.  **Installeer de dependencies**
    ```bash
    npm install
    ```
3.  **Omgevingsvariabelen configureren**
    Kopieer `.env.example` naar `.env` en vul je Firebase-configuratie en de API-basis-URL in.
    ```env
    VITE_API_BASE_URL=http://localhost:3000
    VITE_FIREBASE_API_KEY=your-key
    # ... andere Firebase-variabelen
    ```
4.  **Start de development server**
    ```bash
    npm run dev
    ```
    De applicatie is nu beschikbaar op `http://localhost:5173`.

## 📡 API Endpoints

De backend biedt een RESTful API om de frontend van data te voorzien.

### Authenticatie (`/api/auth`)

- `GET /me`: Haalt het profiel van de huidige ingelogde gebruiker op.
- `PUT /profile`: Werkt het gebruikersprofiel bij (inclusief avatar-upload).
- `POST /sync`: Synchroniseert Firebase Auth-gegevens met de backend-database.

### Forum (`/api/forum`)

- `GET /topics`: Haalt een lijst met forumtopics op, met paginering en filters.
- `POST /topics`: Maakt een nieuw topic aan.
- `GET /topics/:id`: Haalt een specifiek topic op, inclusief antwoorden.
- `POST /topics/:topicId/answers`: Voegt een antwoord toe aan een topic.
- `POST /vote`: Verwerkt stemmen op topics en antwoorden.
- `GET /stats`: Haalt algemene forumstatistieken op.

### Producten (`/api/products`)

- `GET /with-images`: Haalt een lijst met producten op, inclusief afbeeldingen.
- `GET /:id/with-images`: Haalt een specifiek product op via zijn ID.
- `GET /collections`: Haalt een lijst op van alle productcollecties.
- `GET /collection/:id`: Haalt producten op die tot een specifieke collectie behoren.

## 🔐 Authenticatie Flow

1.  De gebruiker logt in op de frontend via de Firebase Authentication SDK (bv. met e-mail/wachtwoord of Google).
2.  De frontend ontvangt een Firebase ID Token.
3.  Dit token wordt met elke API-aanvraag meegestuurd in de `Authorization: Bearer <token>` header.
4.  De backend verifieert het token met de Firebase Admin SDK via de `authenticate` middleware.
5.  Indien geldig, worden de gebruikersgegevens aan het `req.user` object toegevoegd en wordt de aanvraag verwerkt.

## 🤝 Contributing

1.  Fork de repository.
2.  Maak een nieuwe feature branch.
3.  Implementeer je wijzigingen.
4.  Test je wijzigingen grondig.
5.  Dien een pull request in.

## 📝 Licentie

MIT License
