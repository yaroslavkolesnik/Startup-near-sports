# Sports Meetup MVP - Database Models Design

## Overview
This document outlines the core database structure for the MVP of the Sports Meetup mobile application. The app connects people through sports by providing an interactive map to find local pitches and join spontaneous or planned games.

**Tech Stack**: Django (Backend API) + React Native (Frontend) + SQLite (Dev) / PostgreSQL (Prod)

## Database Models

### 1. User (`users.UserModel`)
Extends standard Django `AbstractUser` to retain standard authentication features.
*   `avatar` (`ImageField`, `upload_to='avatars/', null=True, blank=True`) - User's profile photo.
*   `sport_skills` (`JSONField`, `default=dict`,`blank=True`) - Stores skill level per sport. Example: `{"FOOTBALL": "PRO", "PING_PONG": "BEGINNER"}`. (Replaces the old global skill_level).
*   `preferred_sports` (`CharField`, `max_length=255`, `blank=True`) - Comma-separated active sports (e.g., `'football,basketball'`) to avoid complex M2M tables initially.
*   `expo_push_token` (`CharField`, `max_length=255`, `blank=True`, `null=True`) - Stores the Expo push notification token for the user's device, used to send alerts.
*   `created_at` (`DateTimeField`, `auto_now_add=True`)
*   `updated_at` (`DateTimeField`, `auto_now=True`)

### 2. Pitch (`pitches.Pitch`)
Handles the map locations. Powered by UGC (User Generated Content) for fast organic growth.
*   `title` (`CharField`) - Descriptive name.
*   `description` (`TextField`, `blank=True`, `null=True`) - Optional text description for location details or instructions.
*   `latitude` (`DecimalField`) - Map coordinates.
*   `longitude` (`DecimalField`) - Map coordinates.
*   `address` (`CharField`) - Human-readable street address.
*   `sport_type` (`CharField` choices: `FOOTBALL`, `BASKETBALL`, `PING_PONG`, `MULTI`)
*   `photos` (JSONField, default=list) - Stores an array of image URLs (up to 5).
*   `surface_type` (CharField with choices, optional) - strict values: NATURAL_GRASS, SYNTHETIC_GRASS, PARQUET, ASPHALT, RUBBER, SAND.
* `is_paid` (`BooleanField`, `default=False`) - Flag indicating if the pitch requires payment.
* `price_per_hour` (`DecimalField`, `max_digits=8`, `decimal_places=2`, `null=True`, `blank=True`) - Hourly rental price. Mandatory if `is_paid` is True.
*   `created_by` (`ForeignKey` -> `User`, `on_delete=models.SET_NULL`) - Original author of the location.
*   `is_verified` (`BooleanField`, `default=False`) - Admin moderation flag.
*   `created_at` (`DateTimeField`, `auto_now_add=True`)
*   `updated_at` (`DateTimeField`, `auto_now=True`)

### 3. Match (`matches.Match`)
Represents the actual event happening at a pitch.
*   `title` (`CharField`) - Name of the game (e.g., "Saturday Morning Football").
*   `description` (`TextField`, `blank=True`, `null=True`) - Optional text description for game rules or extra info.
*   `pitch` (`ForeignKey` -> `Pitch`) - Location ref.
*   `organizer` (`ForeignKey` -> `User`) - The person initiating the game.
*   `sport_type` (`CharField` choices: `FOOTBALL`, `BASKETBALL`, `PING_PONG`)
*   `level` (`CharField` choices: `BEGINNER`, `AMATEUR`, `PRO`, `ANY`, `default='ANY'`) - Expected skill level for the match participants.
*   `max_players` (`PositiveIntegerField`) - Upper limit of players for this specific game.
*   `start_time` (`DateTimeField`) - Game start time.
*   `duration_minutes` (`PositiveIntegerField`) - Duration to calculate end time / platform availability.
*   `participants` (`ManyToManyField` -> `User`) - Direct linkage to measure current occupancy.
*   `external_chat_link` (`URLField`, `blank=True`) - Optional Telegram/Viber invite link for text coordination.
*   `status` (`CharField` choices: `OPEN`, `FULL`, `CANCELLED`, `FINISHED`, `default=OPEN`)
*   `created_at` (`DateTimeField`, `auto_now_add=True`)
*   `updated_at` (`DateTimeField`, `auto_now=True`)

## Architecture Rules & API Logic
1.  **Strict Isolation**: `frontend` and `backend` must never share structure. They communicate strictly via REST JSON structure.
2.  **M2M Limit Enforcement**: The API (Django REST Framework) is responsible for intercepting `Join` requests and verifying that `match.participants.count() < match.max_players`. If met, the request is rejected (400 Bad Request) and `status` is automatically switched to `FULL`.
3.  **Client Payload Handling**: Failed limit validations will return clear `{ "error": "Match is full" }` structures that React Native gracefully handles visually.
