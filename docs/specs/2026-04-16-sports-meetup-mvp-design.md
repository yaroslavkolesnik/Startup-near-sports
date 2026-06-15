# Sports Meetup MVP - Database Models Design

## Overview
This document outlines the core database structure for the MVP of the Sports Meetup mobile application. The app connects people through sports by providing an interactive map to find local pitches and join spontaneous or planned games.

**Tech Stack**: Django (Backend API) + React Native (Frontend) + SQLite (Dev) / PostgreSQL (Prod)

## Database Models

### 1. User (`users.UserModel`)
Extends standard Django `AbstractUser` to retain standard authentication features.
* `avatar` (`ImageField`, `upload_to='avatars/', null=True, blank=True`) - User's profile photo.
* `sport_skills` (`JSONField`, `default=dict`,`blank=True`) - Stores skill level per sport. Example: `{"FOOTBALL": "PRO", "PING_PONG": "BEGINNER"}`.
* `preferred_sports` (`CharField`, `max_length=255`, `blank=True`) - Comma-separated active sports (e.g., `'football,basketball'`) to avoid complex M2M tables initially.
* `expo_push_token` (`CharField`, `max_length=255`, `blank=True`, `null=True`) - Stores the Expo push notification token for the user's device, used to send alerts.
* `created_at` (`DateTimeField`, `auto_now_add=True`)
* `updated_at` (`DateTimeField`, `auto_now=True`)

### 2. Pitch (`pitches.Pitch`)
Handles the map locations. Powered by UGC (User Generated Content) for fast organic growth.
* `title` (`CharField`) - Descriptive name.
* `description` (`TextField`, `blank=True`, `null=True`) - Optional text description for location details or instructions.
* `latitude` (`DecimalField`) - Map coordinates.
* `longitude` (`DecimalField`) - Map coordinates.
* `address` (`CharField`) - Human-readable street address.
* `sport_type` (`CharField` choices: `FOOTBALL`, `BASKETBALL`, `PING_PONG`, `MULTI`)
* `photos` (`JSONField`, `default=list`) - Stores an array of image URLs (up to 5).
* `surface_type` (`CharField` with choices, optional) - strict values: NATURAL_GRASS, SYNTHETIC_GRASS, PARQUET, ASPHALT, RUBBER, SAND.
* `is_paid` (`BooleanField`, `default=False`) - Flag indicating if the pitch requires payment.
* `price_per_hour` (`DecimalField`, `max_digits=8`, `decimal_places=2`, `null=True`, `blank=True`) - Hourly rental price. Mandatory if `is_paid` is True.
* `fields_count` (`PositiveIntegerField`, `default=1`) - Number of independent fields at the location. Used to allow simultaneous matches without overlap.
* `created_by` (`ForeignKey` -> `User`, `on_delete=models.SET_NULL`) - Original author of the location.
* `is_verified` (`BooleanField`, `default=False`) - Admin moderation flag.
* `is_active` (`BooleanField`, `default=True`) - Flag indicating if the pitch is open for games. If false, it acts as a "closed" status (e.g., under maintenance).
* `status_message` (`CharField`, `max_length=255`, `blank=True`, `null=True`) - Optional text explaining why the pitch is closed (e.g., "Under construction until September").
* `created_at` (`DateTimeField`, `auto_now_add=True`)
* `updated_at` (`DateTimeField`, `auto_now=True`)

### 3. Match (`matches.Match`)
Represents the actual event happening at a pitch.
* `title` (`CharField`) - Name of the game (e.g., "Saturday Morning Football").
* `description` (`TextField`, `blank=True`, `null=True`) - Optional text description for game rules or extra info.
* `pitch` (`ForeignKey` -> `Pitch`) - Location ref.
* `organizer` (`ForeignKey` -> `User`) - The person initiating the game.
* `sport_type` (`CharField` choices: `FOOTBALL`, `BASKETBALL`, `PING_PONG`)
* `level` (`CharField` choices: `BEGINNER`, `AMATEUR`, `PRO`, `ANY`, `default='ANY'`) - Expected skill level for the match participants.
* `max_players` (`PositiveIntegerField`) - Upper limit of players for this specific game.
* `start_time` (`DateTimeField`) - Game start time.
* `duration_minutes` (`PositiveIntegerField`) - Duration to calculate end time / platform availability.
* `participants` (`ManyToManyField` -> `User`) - Direct linkage to measure current occupancy.
* `external_chat_link` (`URLField`, `blank=True`) - Optional Telegram/Viber invite link for text coordination.
* `status` (`CharField` choices: `OPEN`, `FULL`, `CANCELLED`, `FINISHED`, `default=OPEN`)
* `created_at` (`DateTimeField`, `auto_now_add=True`)
* `updated_at` (`DateTimeField`, `auto_now=True`)

### 4. Message (`matches.Message`)
Represents the internal chat messages for a specific match.
* `match` (`ForeignKey` -> `Match`, `related_name='messages'`, `on_delete=models.CASCADE`) - The match this message belongs to.
* `sender` (`ForeignKey` -> `User`, `on_delete=models.CASCADE`) - The user who sent the message.
* `text` (`TextField`) - The content of the message.
* `created_at` (`DateTimeField`, `auto_now_add=True`) - Timestamp of when the message was sent.

## Architecture Rules & API Logic
1.  **Strict Isolation**: `frontend` and `backend` must never share structure. They communicate strictly via REST JSON structure.
2.  **M2M Limit Enforcement**: The API (Django REST Framework) is responsible for intercepting `Join` requests and verifying that `match.participants.count() < match.max_players`. If met, the request is rejected (400 Bad Request) and `status` is automatically switched to `FULL`.
3.  **Time Overlap Validation (Multi-Pitch)**: During match creation or editing, the API checks for time collisions. If the number of active overlapping matches (`start_time` to `start_time + duration_minutes`) meets or exceeds the `Pitch.fields_count`, the request is rejected with a validation error.
4.  **Chat Security**: Messages are accessed via REST API (Short Polling on the frontend). The API strictly enforces that only users present in `match.participants` or the `match.organizer` can read or write messages for that specific match. Unauthorized access returns 403 Forbidden.
5.  **Client Payload Handling**: Failed validations will return clear error structures (e.g., `{ "error": "Match is full" }` or `{ "non_field_errors": ["..."] }`) that React Native gracefully handles visually with user-friendly alerts.