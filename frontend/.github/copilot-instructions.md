# Motordash Frontend - Development Guidelines

This document provides comprehensive guidelines for developing and maintaining the Motordash Vue 3 frontend application.

## Architecture Overview

Motordash is a motorcycle community platform with the following key features:

- Forum system for discussions
- Product catalog with reviews
- User profiles and authentication
- Real-time notifications

## Technical Stack

- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Firebase Auth + Backend JWT
- **State Management**: Pinia stores
- **HTTP Client**: Axios with interceptors
- **Routing**: Vue Router with guards
- **Icons**: Heroicons Vue
- **UI Components**: Headless UI Vue

## Code Standards

### Vue Component Structure

1. Use `<script setup>` syntax for all components
2. Follow this order in components:
   - Script setup block
   - Template
   - Style (scoped)

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.vue`)
- **Files**: kebab-case for non-components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **CSS Classes**: Follow Tailwind conventions

### Import Organization

```javascript
// 1. Vue/framework imports
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

// 2. Third-party libraries
import axios from "axios";

// 3. Internal services/stores
import { useAuthStore } from "@/stores/auth";
import { apiService } from "@/services/api.service";

// 4. Components
import Button from "@/components/common/Button.vue";

// 5. Utils/helpers
import { formatDate } from "@/utils/helpers";
```

## Component Guidelines

### Common Components (`src/components/common/`)

- **Button.vue**: Standardized button with variants
- **Modal.vue**: Accessible modal dialogs
- **LoadingSpinner.vue**: Loading states
- **ErrorMessage.vue**: Error display
- **NotificationContainer.vue**: Toast notifications

### Forum Components (`src/components/forum/`)

- **TopicCard.vue**: Topic display in lists
- **AnswerList.vue**: Display topic answers
- **AnswerForm.vue**: Submit new answers
- **VoteButton.vue**: Voting on answers
- **CreateTopicForm.vue**: New topic creation

### Product Components (`src/components/products/`)

- **ProductGrid.vue**: Product listing layout
- **ProductCard.vue**: Individual product display

### Profile Components (`src/components/profile/`)

- **EditProfileForm.vue**: Profile editing modal

## State Management

### Auth Store (`src/stores/auth.js`)

- User authentication state
- Firebase integration
- Profile management
- Session handling

### Forum Store (`src/stores/forum.js`)

- Topics and answers
- Voting state
- Real-time updates

### Notification Store (`src/stores/notification.js`)

- Toast notifications
- Error handling
- User feedback

## Routing Structure

```
/ - HomeView (public)
/login - LoginView (public)
/register - RegisterView (public)
/forum - ForumView (protected)
/forum/topic/:id - TopicView (protected)
/products - ProductsView (public)
/products/:id - ProductView (public)
/profile/:username - ProfileView (protected)
```

## API Integration

### Service Layer (`src/services/`)

- **api.service.js**: Main API client with interceptors
- **auth.service.js**: Firebase authentication

### API Patterns

```javascript
// Always use the apiService for backend calls
import { apiService } from "@/services/api.service";

// GET request
const response = await apiService.get("/forum/topics");

// POST with data
const response = await apiService.post("/forum/topics", topicData);

// Handle errors consistently
try {
  const response = await apiService.get("/data");
  return response.data;
} catch (error) {
  console.error("API Error:", error);
  throw error;
}
```

## Styling Guidelines

### Tailwind CSS Usage

- Use utility classes for styling
- Follow mobile-first responsive design
- Use custom CSS classes for complex components
- Leverage the custom color scheme (primary, secondary, etc.)

### Color Scheme

- **Primary**: Blue tones for main actions
- **Secondary**: Gray tones for secondary actions
- **Success**: Green for positive feedback
- **Warning**: Yellow for warnings
- **Error**: Red for errors

### Component Styling

```vue
<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Title</h2>
    <p class="text-gray-600">Content</p>
  </div>
</template>
```

## Form Handling

### Validation

- Use computed properties for validation
- Provide immediate feedback
- Show clear error messages

### Example Pattern

```vue
<script setup>
const form = ref({
  email: "",
  password: "",
});

const errors = ref({});

const isValid = computed(() => {
  return form.value.email && form.value.password.length >= 6;
});

const handleSubmit = async () => {
  if (!isValid.value) return;
  // Handle form submission
};
</script>
```

## Error Handling

### Global Error Handling

- API errors caught by Axios interceptors
- User-friendly error messages
- Console logging for debugging

### Component Error Handling

```vue
<script setup>
const error = ref("");
const loading = ref(false);

const handleAction = async () => {
  try {
    loading.value = true;
    error.value = "";
    // Perform action
  } catch (err) {
    error.value = err.message || "An error occurred";
  } finally {
    loading.value = false;
  }
};
</script>
```

## Performance Considerations

### Code Splitting

- Use lazy loading for routes
- Dynamic imports for large components
- Split vendor chunks appropriately

### Optimization

- Use `v-memo` for expensive lists
- Implement proper key attributes for lists
- Avoid unnecessary re-renders

## Testing Approach

### Component Testing

- Test component behavior, not implementation
- Mock external dependencies
- Test user interactions

### Integration Testing

- Test complete user flows
- Test API integration
- Test authentication flows

## Development Workflow

### Local Development

1. Start backend API server
2. Configure Firebase project
3. Set environment variables
4. Run `npm run dev`

### Code Review Guidelines

- Check for proper error handling
- Verify accessibility standards
- Ensure responsive design
- Validate performance implications

## Security Considerations

### Authentication

- Never store sensitive data in localStorage
- Use secure HTTP-only cookies when possible
- Implement proper session management

### API Security

- Validate all user inputs
- Use CSRF protection
- Implement rate limiting

## Accessibility Standards

### WCAG Compliance

- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Screen reader compatibility

### Implementation

```vue
<template>
  <button
    :aria-label="buttonLabel"
    :disabled="isLoading"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <span class="sr-only">{{ screenReaderText }}</span>
    {{ buttonText }}
  </button>
</template>
```

## Environment Configuration

### Required Environment Variables

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# API
VITE_API_BASE_URL=
```

## Deployment

### Build Process

1. Run `npm run build`
2. Test production build with `npm run preview`
3. Deploy dist/ directory to hosting platform

### Environment-Specific Configuration

- Use different Firebase projects for dev/staging/prod
- Configure API URLs appropriately
- Set up proper CORS policies

## Troubleshooting

### Common Issues

1. **Firebase Auth**: Check project configuration
2. **API Calls**: Verify backend server status
3. **Build Errors**: Clear node_modules and reinstall
4. **Styling Issues**: Check Tailwind configuration

### Debug Tools

- Vue DevTools browser extension
- Network tab for API debugging
- Console for JavaScript errors
- Firebase console for auth issues
