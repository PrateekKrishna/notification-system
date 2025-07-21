package main

import (
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"github.com/PrateekKrishna/notification-system/internal/models"
)


func main() {
	// 1. Connect to the database
	dsn := "host=localhost user=user password=password dbname=notifications_db port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database!")
	}

	// 2. Auto-migrate the schema to create the 'preferences' table
	db.AutoMigrate(&models.Preference{})

	// 3. Setup Gin router
	router := gin.Default()
	router.Use(cors.Default())

	v1 := router.Group("/v1")
	{
		// Pass the database connection `db` to the handlers
		v1.GET("/users/:id/preferences", getPreferencesHandler(db))
		v1.PUT("/users/:id/preferences", updatePreferencesHandler(db))
	}

	router.Run(":8081")
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