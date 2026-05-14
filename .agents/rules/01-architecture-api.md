---
trigger: always_on
---

# Rule: Architecture and API Standards

## Trigger
Apply this rule automatically when writing, refactoring, or reviewing code in either the `/frontend` or `/backend` directories.

## Rules

### 1. Strict Separation
- NEVER suggest cross-imports between `/frontend` and `/backend`. They are completely isolated environments.
- The React Native app (`/frontend`) communicates with the Django app (`/backend`) ONLY via REST API network requests.

### 2. Django Backend Standards (/backend)
- Act purely as a REST API. Never use Django templates (`render()`) to return HTML.
- All API responses must be strictly formatted in JSON.
- Standardize responses: Successful responses must wrap data in a `{"data": ...}` object. Error responses must return standard HTTP status codes and an `{"error": "message"}` object.

### 3. React Native Frontend Standards (/frontend)
- Use only Functional Components and React Hooks. Do not write Class Components.
- When making API calls to the backend, handle loading states and error boundaries gracefully.