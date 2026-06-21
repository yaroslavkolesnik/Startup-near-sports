# Security Audit Report: Sports Meetup MVP

**Date:** 2026-06-21
**Scope:** Frontend (React Native) and Backend (Django/DRF)

## 1. Vulnerabilities Found

### Backend (Django/DRF)
1. **Insecure SECRET_KEY Fallback:** 
   In `config/settings.py`, `SECRET_KEY` falls back to `'django-insecure-default'`. If deployed without setting the environment variable, the application is highly vulnerable to session hijacking and cryptographic attacks.
2. **Wildcard ALLOWED_HOSTS:** 
   `ALLOWED_HOSTS` defaults to `*`. This exposes the application to HTTP Host header attacks and DNS rebinding attacks.
3. **Overly Permissive CORS:**
   `CORS_ALLOW_ALL_ORIGINS = True` allows any website to make requests to the API. This can lead to unauthorized data access if combined with authenticated browser sessions.
4. **Missing HTTPS/SSL Enforcement:**
   Production security settings like `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, and `CSRF_COOKIE_SECURE` are missing, meaning data could potentially be sent over unencrypted connections if not handled by a reverse proxy.

### Frontend (React Native)
1. **Hardcoded HTTP API URL:**
   In `src/api/auth.js` and other API files, `API_BASE_URL` is hardcoded to `http://192.168.0.67:8000/api`. Using `http://` instead of `https://` transmits sensitive data (passwords, JWT tokens) in plaintext, making it susceptible to Man-in-the-Middle (MitM) attacks.

## 2. Security Strengths (Gaps Addressed)
- **Token Storage:** The frontend correctly uses `expo-secure-store` (`SecureStore`) to store JWT tokens instead of the insecure `AsyncStorage`.
- **Throttling:** DRF is configured with `AnonRateThrottle` (5/min) and `UserRateThrottle` (120/min), which helps prevent brute-force attacks on endpoints.
- **Permissions:** API views correctly utilize DRF permissions like `IsAuthenticated`, `IsCreatorOrReadOnly`, and `IsMessageSender`.

## 3. Required Improvements (Remediation)

### Backend Remediation (`config/settings.py`):
- Remove the insecure fallback for `SECRET_KEY` (or raise an error if not set in production).
- Set a strict `ALLOWED_HOSTS` list instead of `*`.
- Set `CORS_ALLOW_ALL_ORIGINS = False` and define `CORS_ALLOWED_ORIGINS` or `CORS_ALLOW_CREDENTIALS`.
- Add Django security settings (`SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`).

### Frontend Remediation:
- Change the `API_BASE_URL` to use environment variables (`process.env.EXPO_PUBLIC_API_URL`) to seamlessly switch between local `http://` for development and secure `https://` for production.