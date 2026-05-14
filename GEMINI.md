# Project: Sports Meetup MVP
Description: A mobile application to find and join local sports games (Football, Basketball, Ping-Pong) via an interactive map.

## Tech Stack
- Frontend: React Native (Expo)
- Backend: Django (Python) + Django REST Framework
- Integration: Google Maps API
- Database: SQLite (Development) / PostgreSQL (Production)

## Core Directives
- MVP Focus: Strictly implement only essential features. Do not build complex user profiles, internal real-time chats, or friending systems.
- Communication: Use external links to Telegram/Viber groups for event coordination.
- Project Structure & Architecture: Maintain two distinct root folders: `/frontend` (React Native) and `/backend` (Django). Maintain a strict separation of concerns between the client and the API. 
- API Design: Use standard RESTful patterns. Ensure all endpoints return predictable JSON structures.
- Code Style: Prioritize clean, minimal, and functional boilerplate code to accelerate the MVP launch. Avoid over-engineering.