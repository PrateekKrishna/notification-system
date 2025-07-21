// internal/models/models.go
package models

import "gorm.io/gorm"

// NotificationLog is the database model for logging notifications.
type NotificationLog struct {
    gorm.Model
    UserID    string
    Type      string
    Message   string
    Recipient string
    Status    string // PENDING, SENT, FAILED, SKIPPED
}

// Preference defines the database table structure for user preferences.
type Preference struct {
    gorm.Model
    UserID  string `json:"user_id"`
    Channel string `json:"channel"`
    Enabled bool   `json:"enabled"`
}

// QueueMessage is the message we put on RabbitMQ.
type QueueMessage struct {
    NotificationLogID uint `json:"notification_log_id"`
}

// NotificationRequest is the incoming request from the client.
type NotificationRequest struct {
    UserID    string `json:"user_id"`
    Type      string `json:"type"`
    Message   string `json:"message"`
    Recipient string `json:"recipient"`
}