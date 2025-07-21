package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/PrateekKrishna/notification-system/internal/models"
	"github.com/PrateekKrishna/notification-system/internal/utils"
)



var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))
var redisClient *redis.Client

const (
	rateLimitPerMinute = 20
	rateLimitWindow    = time.Minute
)

func main() {
	// --- Database Connection ---
	dsn := "host=localhost user=user password=password dbname=notifications_db port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database!")
	}
	// This service now needs to know about both tables.
	db.AutoMigrate(&models.NotificationLog{}, &models.Preference{})

	// --- RabbitMQ Connection ---
	conn, err := amqp.Dial("amqp://user:password@localhost:5672/")
	utils.FailOnError(logger, err, "Failed to connect to RabbitMQ")
	defer conn.Close()
	ch, err := conn.Channel()
	utils.FailOnError(logger, err, "Failed to open a channel")
	defer ch.Close()
	_, err = ch.QueueDeclare("notifications", true, false, false, false, nil)
	utils.FailOnError(logger, err, "Failed to declare a queue")

	// --- Redis Connection ---
	redisClient = redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	// --- Gin Router ---
	router := gin.Default()
	router.Use(cors.Default())
	v1 := router.Group("/v1")
	{
		v1.POST("/notifications", rateLimiter(), sendNotificationHandler(ch, db))
	}

	logger.Info("Notification Service running on port 8082")
	router.Run(":8082")
}

// sendNotificationHandler processes the request and publishes to RabbitMQ.
func sendNotificationHandler(ch *amqp.Channel, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request models.NotificationRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// 1. Check if the user exists AND has enabled the specific notification type.
		var preferenceCount int64
		db.Model(&models.Preference{}).Where("user_id = ? AND channel = ? AND enabled = ?", request.UserID, request.Type, true).Count(&preferenceCount)

		if preferenceCount == 0 {
			logger.Warn("Validation failed: User has not opted-in for this notification type or does not exist", "user_id", request.UserID, "type", request.Type)
			c.JSON(http.StatusBadRequest, gin.H{"error": "User does not exist or has not enabled this notification type"})
			return
		}
		// 2. Create the log entry in the database (only if user is valid and has opted-in)
		logEntry := models.NotificationLog{
			UserID:    request.UserID,
			Type:      request.Type,
			Message:   request.Message,
			Recipient: request.Recipient,
			Status:    "PENDING",
		}
		result := db.Create(&logEntry)
		if result.Error != nil {
			logger.Error("Failed to save notification to DB", "error", result.Error)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process request"})
			return
		}

		// 3. Publish the ID to the queue
		queueMsg := models.QueueMessage{NotificationLogID: logEntry.ID}
		body, err := json.Marshal(queueMsg)
		if err != nil {
			logger.Error("Failed to marshal queue message", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process request"})
			return
		}

		err = ch.PublishWithContext(c.Request.Context(), "", "notifications", false, false,
			amqp.Publishing{ContentType: "application/json", Body: body},
		)
		if err != nil {
			logger.Error("Failed to publish message to RabbitMQ", "error", err)
			db.Model(&logEntry).Update("Status", "FAILED")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish notification"})
			return
		}

		logger.Info("Notification logged and queued successfully", "log_id", logEntry.ID)
		c.JSON(http.StatusAccepted, gin.H{"status": "Notification accepted", "log_id": logEntry.ID})
	}
}

// rateLimiter middleware for rate limiting.
func rateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		key := c.ClientIP()

		count, err := redisClient.Incr(ctx, key).Result()
		if err != nil {
			logger.Error("Could not increment rate limit key", "error", err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		if count == 1 {
			redisClient.Expire(ctx, key, rateLimitWindow)
		}

		if count > rateLimitPerMinute {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "Too Many Requests"})
			return
		}

		c.Next()
	}
}

