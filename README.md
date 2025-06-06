# Motordash - Motorcycle Community Platform

A full-stack web application for motorcycle enthusiasts featuring a forum, product catalog, and community features.

## 🏗️ Architecture

```
motordash/
├── backend/           # Node.js Express API
│   ├── routes/        # API route handlers
│   ├── services/      # Business logic layer
│   ├── middleware/    # Authentication, upload, etc.
│   └── server.js      # Main server file
├── front-end/         # React/Vue frontend (to be built)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
└── README.md
```

## 🚀 Quick Start

### Backend Setup

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   Create `.env` file in backend directory:

   ```env
   PORT=3000
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="your-private-key"
   FIREBASE_CLIENT_EMAIL=your-client-email
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-access-token
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Frontend Setup (To Be Built)

The frontend should be built using modern React/Vue.js with:

- Vite for development server
- Firebase Authentication
- Responsive design
- Component-based architecture

## 📡 API Endpoints

### Authentication

- `POST /api/auth/verify` - Verify Firebase token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/signout` - Sign out user

### Forum API

- `POST /api/forum/users/profile` - Create/update user profile
- `GET /api/forum/users/profile/:uid` - Get user profile
- `POST /api/forum/topics` - Create new topic
- `GET /api/forum/topics` - Get topics (with pagination)
- `GET /api/forum/topics/:id` - Get single topic
- `GET /api/forum/search?q=term` - Search topics
- `POST /api/forum/topics/:topicId/answers` - Create answer
- `GET /api/forum/topics/:topicId/answers` - Get topic answers
- `POST /api/forum/vote` - Vote on topic/answer
- `GET /api/forum/vote/:targetId` - Get user vote
- `GET /api/forum/stats` - Get forum statistics

### Products API

- `GET /api/products/with-images` - Get products with images
- `GET /api/products/:id/with-images` - Get product by ID
- `GET /api/products/collection/:id` - Get products by collection

## 🔧 Technology Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **File Upload**: Multer
- **E-commerce**: Shopify API
- **Caching**: Redis (planned)

### Frontend (Planned)

- **Framework**: React 18+ or Vue 3+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth SDK
- **HTTP Client**: Axios
- **Routing**: React Router / Vue Router
- **State Management**: Context API / Pinia

## 🎨 Frontend Requirements

### Core Features

1. **Authentication System**

   - Firebase Auth integration
   - Login/Register forms
   - Protected routes
   - User profile management

2. **Forum Interface**

   - Topic listing with pagination
   - Topic creation with rich text editor
   - Answer/reply system
   - Voting system (upvote/downvote)
   - Search functionality
   - User profiles

3. **Product Catalog**

   - Product grid/list view
   - Product detail pages
   - Category filtering
   - Search functionality
   - Shopify integration

4. **Responsive Design**
   - Mobile-first approach
   - Tablet and desktop layouts
   - Touch-friendly interactions

### UI Components Needed

- Navigation bar with auth status
- Topic cards with vote counts
- Answer/reply components
- Product cards with images
- Search bar with autocomplete
- Pagination controls
- Modal dialogs
- Loading states
- Error boundaries

## 🔐 Authentication Flow

1. User signs in with Firebase Auth
2. Frontend gets ID token
3. Token sent with API requests in Authorization header
4. Backend verifies token with Firebase Admin SDK
5. User data attached to request object

## 📁 API Request/Response Format

### Standard Response Format

```json
{
  "success": true,
  "data": {...},
  "message": "optional message"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message"
}
```

## 🔄 Development Workflow

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd front-end && npm run dev`
3. **API Testing**: Use `/api/health` endpoint to verify backend
4. **CORS**: Already configured for localhost:5173 (Vite default)

## 📊 Database Schema

### Users Collection

```javascript
{
  uid: string,           // Firebase UID
  email: string,
  username: string,      // Unique
  displayName: string,
  bio: string,
  createdAt: timestamp,
  lastActive: timestamp,
  reputation: number,
  topicCount: number,
  answerCount: number
}
```

### Topics Collection

```javascript
{
  id: string,
  title: string,
  content: string,
  authorId: string,
  category: string,
  tags: string[],
  createdAt: timestamp,
  lastActivity: timestamp,
  viewCount: number,
  answerCount: number,
  voteScore: number,
  images: string[]       // URLs
}
```

## 🚀 Deployment

### Backend

- Can be deployed to Heroku, Railway, or Vercel
- Ensure environment variables are set
- Firebase credentials properly configured

### Frontend

- Deploy to Vercel, Netlify, or GitHub Pages
- Update API base URL for production
- Ensure Firebase config is correct

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📝 License

MIT License - see LICENSE file for details
