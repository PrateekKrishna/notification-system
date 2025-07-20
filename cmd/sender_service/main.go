package main

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/smtp"
	"os"

	"github.com/joho/godotenv"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NotificationLog is the database model. It represents a single notification record.
type NotificationLog struct {
	gorm.Model
	UserID    string
	Type      string
	Message   string
	Recipient string
	Status    string // Can be PENDING, SENT, FAILED, SKIPPED
}

// Preference is used to decode the response from the User Preference Service.
type Preference struct {
	Channel string `json:"channel"`
	Enabled bool   `json:"enabled"`
}

// QueueMessage is the structure of the message received from RabbitMQ.
type QueueMessage struct {
	NotificationLogID uint `json:"notification_log_id"`
}

// Global variables for shared resources.
var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))
var twilioClient *twilio.RestClient
var db *gorm.DB

func main() {
	// Load environment variables from the .env file in the project root.
	err := godotenv.Load("../../.env")
	if err != nil {
		logger.Warn("Error loading .env file, continuing without it")
	}

	// --- Database Connection ---
	dsn := "host=localhost user=user password=password dbname=notifications_db port=5432 sslmode=disable"
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database!")
	}
	// This ensures the notification_logs table exists.
	db.AutoMigrate(&NotificationLog{})

	// Initialize the Twilio client.
	twilioClient = twilio.NewRestClient()

	// --- RabbitMQ Connection ---
	conn, err := amqp.Dial("amqp://user:password@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare("notifications", true, false, false, false, nil)
	failOnError(err, "Failed to declare a queue")

	// Start consuming messages from the queue.
	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	failOnError(err, "Failed to register a consumer")

	logger.Info("Sender Service started. Waiting for messages.")

	// Use a channel to block the main function from exiting.
	forever := make(chan bool)

	// Start a goroutine to process messages from the queue.
	go func() {
		for d := range msgs {
			// Launch a new goroutine for each message to process them concurrently.
			go processMessage(d)
		}
	}()

	// Block forever.
	<-forever
}

// processMessage handles a single message from the queue.
func processMessage(d amqp.Delivery) {
	var qm QueueMessage
	err := json.Unmarshal(d.Body, &qm)
	if err != nil {
		logger.Error("Failed to decode queue message", "error", err)
		d.Nack(false, false) // Discard malformed message.
		return
	}

	var logEntry NotificationLog
	result := db.First(&logEntry, qm.NotificationLogID)
	if result.Error != nil {
		logger.Error("Failed to find notification log in DB", "log_id", qm.NotificationLogID, "error", result.Error)
		d.Nack(false, false)
		return
	}
	logger.Info("Processing message", "log_id", logEntry.ID, "user_id", logEntry.UserID)

	resp, err := http.Get("http://localhost:8081/v1/users/" + logEntry.UserID + "/preferences")
	if err != nil {
		logger.Error("Failed to call user preference service", "error", err, "log_id", logEntry.ID)
		d.Nack(false, true)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var prefs []Preference
	json.Unmarshal(body, &prefs)

	// Default to false. A notification is only sent if an explicit "enabled: true" preference is found.
	shouldSend := false
	for _, p := range prefs {
		if p.Channel == logEntry.Type && p.Enabled {
			shouldSend = true
			break
		}
	}

	
	var sendErr error
	if shouldSend {
		switch logEntry.Type {
		case "sms":
			sendErr = sendSMS(logEntry)
		case "email":
			sendErr = sendEmail(logEntry)
		case "whatsapp":
			sendErr = sendWhatsApp(logEntry)
		default:
			logger.Warn("Unsupported notification type", "type", logEntry.Type, "log_id", logEntry.ID)
		}
	} else {
		logger.Info("SKIPPED: User has no preference or has disabled this notification type", "log_id", logEntry.ID)
	}

	newStatus := "SENT"
	if !shouldSend {
		newStatus = "SKIPPED"
	} else if sendErr != nil {
		newStatus = "FAILED"
		logger.Error("Failed to send notification", "log_id", logEntry.ID, "error", sendErr)
	}
	db.Model(&logEntry).Update("Status", newStatus)

	logger.Info("Finished processing", "log_id", logEntry.ID, "status", newStatus)

	d.Ack(false)
}

// --- Sender Functions ---

func sendSMS(n NotificationLog) error {
	params := &twilioApi.CreateMessageParams{}
	params.SetTo(n.Recipient)
	params.SetFrom(os.Getenv("TWILIO_PHONE_NUMBER"))
	params.SetBody(n.Message)
	_, err := twilioClient.Api.CreateMessage(params)
	return err
}

func sendWhatsApp(n NotificationLog) error {
	params := &twilioApi.CreateMessageParams{}
	params.SetTo("whatsapp:" + n.Recipient)
	params.SetFrom(os.Getenv("TWILIO_WHATSAPP_NUMBER"))
	params.SetBody(n.Message)
	_, err := twilioClient.Api.CreateMessage(params)
	return err
}

func sendEmail(n NotificationLog) error {
	from := os.Getenv("GMAIL_ADDRESS")
	password := os.Getenv("GMAIL_APP_PASSWORD")
	to := []string{n.Recipient}
	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	subject := "Subject: A Notification from Your Project\r\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := "<html><body>" + n.Message + "</body></html>"
	msg := []byte(subject + mime + body)
	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, msg)
	return err
}

// failOnError is a helper function to handle critical startup errors.
func failOnError(err error, msg string) {
	if err != nil {
		logger.Error(msg, "error", err)
		panic(err)
	}
}
