# Motordash Frontend

A modern Vue 3 frontend application for the Motordash motorcycle community platform, featuring forum discussions and product catalogs.

## 🚀 Features

- **Modern Stack**: Vue 3 + Vite for fast development and builds
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Authentication**: Firebase Auth with email/password and Google login
- **Forum System**: Create topics, post answers, vote on content
- **Product Catalog**: Browse and search motorcycle gear and parts
- **User Profiles**: Customizable user profiles with avatars
- **Real-time Updates**: Live notifications and updates
- **State Management**: Pinia for efficient state management

## 🛠️ Tech Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Firebase Auth
- **HTTP Client**: Axios with interceptors
- **Routing**: Vue Router with guards
- **State Management**: Pinia
- **Icons**: Heroicons
- **UI Components**: Headless UI

## 🚦 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment example file:

```bash
cp .env.example .env
```

Update `.env` with your Firebase configuration and API settings.

### 3. Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/           # Reusable components
│   ├── common/          # Common UI components
│   ├── forum/           # Forum-specific components
│   ├── products/        # Product-related components
│   └── profile/         # Profile components
├── composables/         # Vue composables
├── router/              # Vue Router configuration
├── services/            # API and external services
├── stores/              # Pinia stores
├── utils/               # Utility functions
└── views/               # Page components
    └── auth/            # Authentication views
```

## 🔧 Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```
