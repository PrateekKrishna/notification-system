# Scalable Notification Microservice System

This project is a robust, scalable, and multi-channel notification system built with a modern microservices architecture. It is designed to handle notifications via Email, SMS, and WhatsApp, with features like user preference management, rate limiting, and persistent logging.

### Key Features

- **Multi-Channel Delivery**: Send notifications via Email (Gmail SMTP), SMS (Twilio), and WhatsApp (Twilio).
- **Microservices Architecture**: Backend logic is decoupled into three core services written in Go:
    - **Notification Service**: A secure API entry point with Redis-based rate limiting.
    - **User Preference Service**: Manages user opt-in settings for different notification channels.
    - **Sender Service**: A concurrent background worker that consumes jobs from a queue and dispatches notifications.
- **Asynchronous Processing**: Utilizes RabbitMQ as a message broker to queue notification jobs, ensuring high throughput and resilience.
- **Persistent Storage**: User preferences and notification logs (with `PENDING`, `SENT`, `FAILED` statuses) are stored in a PostgreSQL database.
- **Modern Frontend**: A responsive user interface built with React (Vite) and styled with Tailwind CSS for managing preferences and sending notifications.


### Tech Stack

| Category           | Technology                                         |
| ------------------ | -------------------------------------------------- |
| **Backend** | Go (Golang)                                        |
| **Frontend** | React.js (Vite), Tailwind CSS                      |
| **Database** | PostgreSQL                                         |
| **Queueing** | RabbitMQ                                           |
| **Caching** | Redis (for Rate Limiting)                          |
| **APIs** | Twilio (for SMS/WhatsApp), Gmail SMTP (for Email)  |
| **Containerization** | Docker, Docker Compose                             |


### Getting Started

1.  **Prerequisites**:
    - Go (v1.21+)
    - Node.js (v18+)
    - Docker & Docker Compose

2.  **Configuration**:
    - Clone the repository.
    - Create a `.env` file in the project root by copying `.env.example`.
    - Fill in your credentials for PostgreSQL, Twilio, and Gmail (App Password).

3.  **Run Locally**:
    - Execute the development script to start all services:
      ```bash
      chmod +x start_dev.sh
      ./start_dev.sh
      ```
    - The services will be available at:
        - **Frontend**: `http://localhost:5173`
        - **Postgres DB UI (Adminer)**: `http://localhost:8080`
        - **User Preference API**: `http://localhost:8081`
        - **Notification API**: `http://localhost:8082`
        - **RabbitMQ UI**: `http://localhost:15672`

