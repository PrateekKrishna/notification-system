package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/PrateekKrishna/notification-system/internal/models"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func main() {
	// 1. Connect to the database using environment variables
	dsn := getEnv("DATABASE_URL", "host=localhost user=user password=password dbname=notifications_db port=5432 sslmode=disable")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database!")
	}

	// 2. Auto-migrate the schema to create the 'preferences' and 'users' tables
	db.AutoMigrate(&models.User{}, &models.Preference{})

	// 3. Setup Gin router
	router := gin.Default()
	router.Use(cors.Default())

	v1 := router.Group("/v1")
	{
		// Pass the database connection `db` to the handlers
		v1.POST("/users", registerUserHandler(db))
		v1.GET("/users", getAllUsersHandler(db))
		v1.GET("/users/:id", getUserHandler(db))
		v1.GET("/users/:id/preferences", getPreferencesHandler(db))
		v1.PUT("/users/:id/preferences", updatePreferencesHandler(db))
	}

	port := getEnv("PORT", "8081")
	router.Run(":" + port)
}

func getPreferencesHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var preferences []models.Preference

		// Find preferences where user_id matches
		result := db.Where("user_id = ?", id).Find(&preferences)

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		if len(preferences) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("No preferences found for user %s", id)})
			return
		}

		c.JSON(http.StatusOK, preferences)
	}
}

func updatePreferencesHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var newPrefs []models.Preference

		if err := c.ShouldBindJSON(&newPrefs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		// Start a transaction
		tx := db.Begin()

		// Delete old preferences for this user
		tx.Where("user_id = ?", id).Delete(&models.Preference{})

		// Create new preferences
		for _, pref := range newPrefs {
			pref.UserID = id // Ensure user ID is set correctly
			tx.Create(&pref)
		}

		// Commit the transaction
		tx.Commit()

		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": fmt.Sprintf("Preferences for user %s updated successfully!", id),
		})
	}
}

func registerUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newUser models.User

		if err := c.ShouldBindJSON(&newUser); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		if newUser.ID == "" || newUser.Email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and Email are required"})
			return
		}

		// Create the new user
		if result := db.Create(&newUser); result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user. ID may already exist."})
			return
		}

		c.JSON(http.StatusCreated, newUser)
	}
}

func getUserHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user models.User

		result := db.Where("id = ?", id).First(&user)
		if result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("User %s not found", id)})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

func getAllUsersHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []models.User

		// Preload is used to efficiently fetch the associated Preferences for each user
		result := db.Preload("Preferences").Find(&users)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
			return
		}

		c.JSON(http.StatusOK, users)
	}
}
