# Sports Meetup Mobile App: Security Audit Report

**Date:** 2026-06-13
**Tool:** AI Security Tester (OWASP Mobile & API Top 10)

During the automated source code analysis of the project's MVP (Frontend: React Native, Backend: Django DRF), the following architectural decisions, vulnerabilities, and security gaps were identified.

---

## 🟢 Positive Findings (What was done well)
* **Secure Token Storage:** The frontend uses `expo-secure-store` to store JWTs (Access and Refresh tokens), protecting them from extraction by malicious actors. `AsyncStorage` is not used for critical data.
* **SQL Injection Protection:** The backend exclusively uses the Django ORM, which automatically parameterizes SQL queries and neutralizes code injection threats.
* **Password Validation:** Standard password validators (`MinimumLengthValidator`, `NumericPasswordValidator`, etc.) are enabled in `settings.py` and are correctly invoked in the registration serializer.
* **Session Isolation (Throttling):** Rate Limiting is configured in DRF settings (5 requests per minute for anonymous users, 120 for authenticated users), which protects against brute-force and basic-level DDoS attacks.

---

## 🔴 Vulnerabilities and Critical Gaps

> [!WARNING]
> The following vulnerabilities must be resolved prior to the production release (App Store / Google Play).

### 1. Cleartext Data Transmission (HTTP)
**Component:** Frontend (`src/api/auth.js`, `src/api/pitches.js`, etc.)
**Description:** The base API URL is hardcoded as `http://192.168.0.67:8000/api`. Using the HTTP protocol means that all data, including passwords during registration/login and JWT tokens, are transmitted in cleartext and can be intercepted via a "Man-in-the-Middle" (MitM) attack.
**Required Improvement:** - Migrate the production server to HTTPS (with an SSL/TLS certificate configuration).
- Move the URL configuration to `.env` files (e.g., using `react-native-dotenv`) to use HTTP locally and strictly HTTPS in production.

### 2. Overly Permissive CORS Policy (Cross-Origin Resource Sharing)
**Component:** Backend (`config/settings.py`)
**Description:** The `CORS_ALLOW_ALL_ORIGINS = True` parameter allows requests to your API from any domain name. Although mobile applications ignore CORS, if the API becomes public or vulnerable to web attacks (CSRF from other sites), this creates a massive security gap.
**Required Improvement:** - Set `CORS_ALLOW_ALL_ORIGINS = False`.
- Configure `CORS_ALLOWED_ORIGINS` exclusively for trusted domains (if a web version of the admin panel is planned).

### 3. Insecure Host Configurations (ALLOWED_HOSTS)
**Component:** Backend (`config/settings.py`)
**Description:** `ALLOWED_HOSTS` defaults to `*` (`os.environ.get('ALLOWED_HOSTS', '*').split(',')`). In production, this makes the server vulnerable to HTTP Host Header Injection attacks, which can lead to password reset spoofing or cache poisoning.
**Required Improvement:** In a production environment, the `ALLOWED_HOSTS` variable must strictly contain only the server's IP address and its domain name.

### 4. Risk of Using the Default SECRET_KEY
**Component:** Backend (`config/settings.py`)
**Description:** The `SECRET_KEY` falls back to `'django-insecure-default'` if the environment variable is not set. If the server is accidentally deployed without a properly configured `.env`, attackers could forge sessions and tokens.
**Required Improvement:** Wrap the key retrieval in production within a block that raises an error if the key is missing, or use a package like `django-environ`.

---

## 🟡 Architectural Recommendations (Improvements)

> [!TIP]
> Recommendations to increase the security maturity level (Defense in Depth).

1. **SSL Pinning:** To protect against advanced MitM attacks on compromised devices, consider implementing SSL Pinning on the frontend (e.g., via the `react-native-ssl-pinning` library).
2. **Deep Links Validation:** If Deep Links are implemented in the app (e.g., for sharing matches), incoming URL parameters must be strictly validated before parsing and using them in the app (to prevent JS-level XSS/injections).
3. **Token Rotation (Refresh Token Reuse):** In the current token implementation (`SIMPLE_JWT`), the Refresh token lifetime is 7 days. It is advisable to add the `ROTATE_REFRESH_TOKENS = True` check in the DRF Simple JWT settings so that a new refresh token is issued (invalidating the old one) each time the access token is refreshed, thereby minimizing the risks of session hijacking.