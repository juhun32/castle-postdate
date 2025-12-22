package handlers

import (
	"context"
	"log" // 1. Add the "log" package
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
)

type FeedbackPayload struct {
	FeedbackText string `json:"feedbackText" binding:"required"`
	Category     string `json:"category" binding:"required"`
}

type AdminCommentPayload struct {
	Comment string `json:"comment" binding:"required"`
}

// SubmitFeedback handles the submission of user feedback.
func SubmitFeedback(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var payload FeedbackPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload: " + err.Error()})
		return
	}

	fsClient, ok := c.MustGet("firestore").(*firestore.Client)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Firestore client"})
		return
	}
	ctx := context.Background()

	feedbackData := map[string]interface{}{
		"feedbackText": payload.FeedbackText,
		"submittedAt":  time.Now(),
		"adminComment": "",
		"category":     payload.Category,
	}

	_, _, err := fsClient.Collection("users").Doc(uid.(string)).Collection("feedback").Add(ctx, feedbackData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save feedback"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Feedback submitted successfully"})
}

func GetUserFeedback(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Printf("Fetching feedback for UID: %s", uid.(string)) // Add this log

	fsClient, ok := c.MustGet("firestore").(*firestore.Client)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Firestore client"})
		return
	}
	ctx := context.Background()

	feedbackList := make([]map[string]interface{}, 0)

	iter := fsClient.Collection("users").Doc(uid.(string)).Collection("feedback").OrderBy("submittedAt", firestore.Asc).Documents(ctx)
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Firestore query error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to iterate feedback documents"})
			return
		}
		data := doc.Data()
		data["id"] = doc.Ref.ID
		feedbackList = append(feedbackList, data)
	}

	log.Printf("Found %d feedback documents for UID: %s", len(feedbackList), uid.(string)) // Add this log

	c.JSON(http.StatusOK, feedbackList)
}
