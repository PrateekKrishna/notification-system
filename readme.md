# 🔔 Notification Microservices System

A production-ready, multi-channel notification platform built with a **Go microservices architecture**. Supports real-time delivery via **Email**, **SMS**, and **WhatsApp** with user preference management, async message queuing, Redis rate limiting, and a React dashboard.

🚀 **[Live Demo](https://frontend-production-49e6.up.railway.app)** · **[GitHub](https://github.com/PrateekKrishna/notification-system)**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│             (Vite + Tailwind CSS)                    │
└────────────┬────────────────────┬───────────────────┘
             │                    │
             ▼                    ▼
┌────────────────────┐  ┌──────────────────────────┐
│ User Preference    │  │   Notification Service    │
│ Service (:8081)    │  │       (:8082)             │
│                    │  │  • Rate limiting (Redis)  │
│ • Register users   │  │  • Validates preferences  │
│ • Manage opt-ins   │  │  • Publishes to RabbitMQ  │
└────────┬───────────┘  └──────────────┬────────────┘
         │                             │
         ▼                             ▼
┌─────────────────┐         ┌──────────────────────┐
│   PostgreSQL    │◄────────│      RabbitMQ         │
│                 │         │  (notifications queue) │
│ • users         │         └──────────┬────────────┘
│ • preferences   │                    │
│ • notification_ │                    ▼
│   logs          │         ┌──────────────────────┐
└─────────────────┘◄────────│   Sender Service      │
                             │  (background worker)  │
                             │                       │
                             │  • Email (Gmail SMTP) │
                             │  • SMS (Twilio)       │
                             │  • WhatsApp (Twilio)  │
                             └──────────────────────┘
```

### How a Notification Flows

1. **Frontend** sends a `POST /v1/notifications` request to the Notification Service
2. **Notification Service** checks the user's preferences in PostgreSQL and validates they've opted in to that channel
3. If valid, the notification is logged as `PENDING` in the DB and its ID is published to **RabbitMQ**
4. **Sender Service** picks up the message from the queue, fetches full details from the DB, and dispatches it via the appropriate provider
5. The DB log is updated to `SENT`, `FAILED`, or `SKIPPED`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Go (Gin framework) |
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Database** | PostgreSQL (GORM ORM) |
| **Message Queue** | RabbitMQ |
| **Caching / Rate Limiting** | Redis |
| **Notification Providers** | Twilio (SMS & WhatsApp), Gmail SMTP |
| **Containerization** | Docker, Docker Compose |
| **Deployment** | Railway.app |

---

## Services

### 1. User Preference Service (`cmd/user_preference_service`) — Port 8081

Manages users and their notification channel opt-ins.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/users` | Register a new user |
| `GET` | `/v1/users` | Get all users with preferences |
| `GET` | `/v1/users/:id` | Get a single user |
| `GET` | `/v1/users/:id/preferences` | Get user's notification preferences |
| `PUT` | `/v1/users/:id/preferences` | Update user's notification preferences |

### 2. Notification Service (`cmd/notification_service`) — Port 8082

The API gateway for sending notifications. Includes per-IP rate limiting (20 req/min via Redis).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/v1/notifications` | Queue a notification for delivery |

**Request Body:**
```json
{
  "user_id": "prateek123",
  "type": "email",
  "message": "Hello from the notification system!",
  "recipient": "user@example.com"
}
```
**Supported types:** `email`, `sms`, `whatsapp`

### 3. Sender Service (`cmd/sender_service`) — Background Worker

A concurrent RabbitMQ consumer. Spawns a goroutine per message for parallel processing. No HTTP port — it runs entirely as a background worker.

---

## Data Models

### User
```go
type User struct {
    ID          string       // unique handle (e.g. "prateek123")
    Name        string
    Email       string
    PhoneNumber string
    Preferences []Preference
}
```

### Preference
```go
type Preference struct {
    UserID  string  // FK to User
    Channel string  // "email" | "sms" | "whatsapp"
    Enabled bool
}
```

### NotificationLog
```go
type NotificationLog struct {
    UserID    string
    Type      string  // "email" | "sms" | "whatsapp"
    Message   string
    Recipient string
    Status    string  // "PENDING" | "SENT" | "FAILED" | "SKIPPED"
}
```

---

## Project Structure

```
notification-system/
├── cmd/
│   ├── user_preference_service/  # User & preference API
│   ├── notification_service/     # Notification intake API + rate limiter
│   └── sender_service/           # Async queue consumer & dispatcher
├── internal/
│   ├── models/                   # Shared GORM data models
│   └── utils/                    # Shared utility functions
├── frontend/                     # React + Vite frontend
│   ├── src/components/
│   │   ├── UserRegistration.jsx  # Register new user form
│   │   ├── PreferenceManager.jsx # Manage notification opt-ins
│   │   ├── NotificationSender.jsx# Send a notification
│   │   └── UserList.jsx          # Dashboard — all users & preferences
│   └── Dockerfile                # Production build with nginx
├── Dockerfile.user-preference    # Docker build for user-preference-service
├── Dockerfile.notification       # Docker build for notification-service
├── Dockerfile.sender             # Docker build for sender-service
├── docker-compose.yml            # Local dev infrastructure
├── start_dev.sh                  # One-command local dev startup script
└── .env.example                  # Environment variable template
```

---

## Local Development

### Prerequisites
- Go 1.21+
- Node.js 18+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/PrateekKrishna/notification-system.git
cd notification-system

# 2. Create your environment file
cp .env.example .env
# Fill in your Twilio and Gmail credentials in .env

# 3. Start everything with a single command
chmod +x start_dev.sh
./start_dev.sh
```

### Local Service URLs

| Service | URL |
|---|---|
| React Frontend | http://localhost:5173 |
| User Preference API | http://localhost:8081 |
| Notification API | http://localhost:8082 |
| PostgreSQL Admin (Adminer) | http://localhost:8080 |
| RabbitMQ Management UI | http://localhost:15672 |

**Adminer login:** System: `PostgreSQL`, Server: `postgres`, User: `user`, Password: `password`, DB: `notifications_db`

**RabbitMQ login:** User: `user`, Password: `password`

---

## Environment Variables

Create a `.env` file at the project root:

```env
# Twilio — for SMS and WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Gmail — for Email notifications (use an App Password)
GMAIL_ADDRESS=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

In production (Railway), additionally set:

```env
DATABASE_URL=         # PostgreSQL connection string
RABBITMQ_URL=         # amqp://... from CloudAMQP
REDIS_URL=            # redis://... from Railway Redis
USER_PREF_SERVICE_URL= # Public URL of user-preference-service
```

---

## Deployment

This project is deployed on **[Railway.app](https://railway.app)** using Docker.

**Infrastructure:**
- PostgreSQL → Railway managed database
- Redis → Railway managed database  
- RabbitMQ → CloudAMQP free tier (Little Lemur plan)

Each microservice is deployed as a separate Railway service using its own Dockerfile. The React frontend is built with Vite and served via nginx.

---

## Key Design Decisions

- **Preference validation at two layers**: The Notification Service checks preferences before queuing, and the Sender Service re-checks before sending — ensuring correctness even with race conditions
- **Decoupled services via RabbitMQ**: Notification intake is fast and non-blocking; actual sending is async
- **Concurrent message processing**: Sender Service spawns a goroutine per message for parallelism
- **Rate limiting via Redis**: Per-IP sliding window, 20 requests/minute, no DB calls needed
- **Environment-first config**: All connection strings read from env vars with localhost fallbacks for seamless local dev
