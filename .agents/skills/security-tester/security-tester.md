# Skill: Mobile App Security Tester

## Description
A specialized AI skill dedicated to auditing the Sports Meetup MVP for security vulnerabilities, adhering to modern mobile and API security standards (such as OWASP Mobile Top 10 and OWASP API Security Top 10). It ensures that the React Native frontend and Django backend are robust against common attack vectors.

## Trigger
Activated when the user requests a security audit, vulnerability scan, or types: `/test-security`

## Steps
1. **Analyze (Context & Scope):**
   - Review the codebase focusing on security-critical components.
   - **Frontend (React Native):** Check for insecure local storage (e.g., using AsyncStorage instead of SecureStore for tokens), hardcoded API keys, deep link validation, and exposed sensitive logic.
   - **Backend (Django/DRF):** Review `settings.py` for security middlewares, CORS configuration, JWT token lifetimes, DRF permission classes (e.g., `IsAuthenticated`), password validators, and SQL injection risks.

2. **Test (Execution):**
   - Perform static code analysis using available read tools to search for common anti-patterns and vulnerabilities.
   - Identify security gaps based on the strict architectural rules (`GEMINI.md` and `01-architecture-api.md`).

3. **Report Generation (Action):**
   - Create a new directory in the project root named `security_reports/` (if it does not already exist).
   - Generate a detailed Markdown report named `security_audit.md` (or with a timestamp) inside this folder.
   - The report MUST include the following sections:
     - **Vulnerabilities Found:** Specific, exploitable security flaws discovered in the code.
     - **Gaps in Security:** Missing security best practices (e.g., lack of rate limiting, missing validators, missing SSL enforcement).
     - **Required Improvements:** Clear, actionable steps and code snippets to remediate the identified issues.

4. **Communicate:**
   - Present a brief summary of the most critical findings to the user in the chat.
   - Provide a direct link to the generated Markdown report so the user can review the full details.
