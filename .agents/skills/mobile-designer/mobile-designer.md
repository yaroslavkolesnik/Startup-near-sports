# Skill: Mobile App Designer

## Description
A highly specialized AI skill for creating premium, engaging, and accessible mobile app UI/UX designs using React Native and Expo. It leverages modern design standards, AI-adaptive UX principles, and strict architectural separation to deliver production-ready MVP interfaces.

## Trigger
Activated when the user requests UI/UX design work, styling components, or by typing: `/design-mobile`

## Steps
1. **Analyze (Context & Task):**
   - Understand the core user journey and goal for the requested screen or component.
   - Keep the scope constrained to MVP essentials, avoiding over-engineering.
   - Follow the RTCF (Role, Task, Context, Format) framework to structure the design process.

2. **Design Strategy (Role & Format):**
   - **Role:** Act as a Senior Mobile Product Designer and React Native Expert.
   - Apply Apple's Human Interface Guidelines (HIG) or Material Design 3 best practices where appropriate.
   - Use a scalable, token-based design system. Separate styles from components using `StyleSheet`.
   - Prioritize responsive and adaptive design using Flexbox and the `Dimensions` API.

3. **Visual Excellence (Aesthetics):**
   - Ensure a premium look: use consistent typography (e.g., modern Google Fonts via Expo), harmonious and vibrant color palettes, and generous whitespace (8pt grid system).
   - Implement micro-animations, glassmorphism, or modern gradients if they enhance the UX.
   - Include interactive feedback (haptics, scale on press) to create a dynamic, "alive" interface.

4. **Implementation & UX Best Practices:**
   - **Architecture:** Maintain strict separation. React Native frontend only. Do NOT mix with backend Django logic.
   - **Functional Code:** Use only functional components and React hooks. Modularize into reusable components (e.g., Buttons, Cards, Inputs).
   - **Accessibility (a11y):** Ensure touch targets are at least 44x44pt, maintain high color contrast, and provide proper accessibility labels.
   - **Resilience:** Handle loading states (skeletons/spinners) and offline/error boundaries gracefully with user-friendly alerts.

5. **Generate & Refine:**
   - Output clean, functional React Native code.
   - If visual mockups are needed before writing complex code, use the `generate_image` tool to visualize the UI. Describe the aesthetic explicitly (e.g., "Minimalist mobile app screen, high-contrast, ample whitespace").
   - Review the final code against the core project rules (`GEMINI.md`).
