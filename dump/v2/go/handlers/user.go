package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type UserMetadata struct {
	ID            string    `json:"id"`
	UserID        string    `json:"userId"`
	Sex           string    `json:"sex"`
	StartedDating string    `json:"startedDating,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type UpdateUserMetadataRequest struct {
	Sex           *string `json:"sex,omitempty"`
	StartedDating *string `json:"startedDating,omitempty"` // YYYY-MM-DD
}

func GetUserMetadata(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	doc, err := fsClient.Collection("users").Doc(uid.(string)).Get(ctx)
	if err != nil {
		if strings.Contains(err.Error(), "NotFound") {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	data := doc.Data()

	c.JSON(http.StatusOK, gin.H{"userMetadata": data})
}

func UpdateUserMetadata(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req UpdateUserMetadataRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()
	uidStr := uid.(string)

	// fetch previous startedDating value
	// this is needed to determine if we need to create or update event
	userDoc, err := fsClient.Collection("users").Doc(uidStr).Get(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	prevStartedDating, _ := userDoc.Data()["startedDating"].(string)

	updateData := []firestore.Update{
		{Path: "updatedAt", Value: time.Now()},
	}

	if req.Sex != nil {
		if *req.Sex != "male" && *req.Sex != "female" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid value for sex"})
			return
		}
		updateData = append(updateData, firestore.Update{Path: "sex", Value: *req.Sex})
	}

	if req.StartedDating != nil {
		_, err := time.Parse("01/02/2006", *req.StartedDating)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format for startedDating. Use MM/DD/YYYY"})
			return
		}
		updateData = append(updateData, firestore.Update{Path: "startedDating", Value: *req.StartedDating})
	}

	userDocRef := fsClient.Collection("users").Doc(uidStr)
	_, err = userDocRef.Update(ctx, updateData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user metadata"})
		return
	}

	// event handling for startedDating
	if req.StartedDating != nil && *req.StartedDating != prevStartedDating {
		userEmail := userDoc.Data()["email"].(string)
		ddayTitle := "Anniversary"
		ddayDate := ""
		t, _ := time.Parse("01/02/2006", *req.StartedDating)
		ddayDate = t.Format("20060102")

		ddayQuery := fsClient.Collection("ddays").
			Where("createdBy", "==", userEmail).
			Where("title", "==", ddayTitle).
			Limit(1)
		ddayDocs, err := ddayQuery.Documents(ctx).GetAll()

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing event"})
			return
		}

		if strings.TrimSpace(prevStartedDating) == "" && *req.StartedDating != "" {
			newDDay := map[string]interface{}{
				"title":          ddayTitle,
				"group":          "important",
				"description":    "The day everything started",
				"date":           ddayDate,
				"isAnnual":       true,
				"createdBy":      userEmail,
				"connectedUsers": []string{},
				"createdAt":      time.Now(),
				"updatedAt":      time.Now(),
				"editable":       false,
			}
			_, _, _ = fsClient.Collection("ddays").Add(ctx, newDDay)
		} else if prevStartedDating != "" && *req.StartedDating != "" && len(ddayDocs) > 0 {
			ddayRef := ddayDocs[0].Ref
			_, _ = ddayRef.Update(ctx, []firestore.Update{
				{Path: "date", Value: ddayDate},
				{Path: "updatedAt", Value: time.Now()},
			})
		}
	}

	// if startedDating updated, also update for partner
	if req.StartedDating != nil {
		connectionDocs, _ := fsClient.Collection("users").Doc(uidStr).Collection("connections").
			Where("status", "==", "active").Limit(1).Documents(ctx).GetAll()

		if len(connectionDocs) > 0 {
			connectionData := connectionDocs[0].Data()
			if partnerUID, ok := connectionData["partnerUID"].(string); ok && partnerUID != "" {
				partnerDocRef := fsClient.Collection("users").Doc(partnerUID)
				parsedDate := *req.StartedDating
				partnerDocRef.Update(ctx, []firestore.Update{
					{Path: "startedDating", Value: parsedDate},
					{Path: "updatedAt", Value: time.Now()},
				})
			}
		}
	}

	updatedDoc, err := userDocRef.Get(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated metadata"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"userMetadata": updatedDoc.Data()})
}

func GetPartnerMetadata(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	connectionDocs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").
		Where("status", "==", "active").
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch connection"})
		return
	}

	if len(connectionDocs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No partner connection found"})
		return
	}

	connectionData := connectionDocs[0].Data()
	partnerEmail := connectionData["partnerEmail"].(string)

	partnerUserDocs, err := fsClient.Collection("users").
		Where("email", "==", partnerEmail).
		Documents(ctx).GetAll()

	if err != nil || len(partnerUserDocs) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner data"})
		return
	}

	partnerDoc := partnerUserDocs[0]
	partnerData := partnerDoc.Data()

	c.JSON(http.StatusOK, gin.H{"partnerMetadata": partnerData})
}

func DeleteUser(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// get client from context
	fsClient, ok := c.MustGet("firestore").(*firestore.Client)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Firestore client"})
		return
	}

	ctx := context.Background()
	uidStr := uid.(string)

	userDoc, err := fsClient.Collection("users").Doc(uidStr).Get(ctx)
	if err != nil {
		// if user doc is not found it might have been already deleted
		// just proceed with cleanup
	}

	if userDoc.Exists() {
		// remove connections
		connections, _ := fsClient.Collection("users").Doc(uidStr).Collection("connections").Documents(ctx).GetAll()
		for _, connDoc := range connections {
			connData := connDoc.Data()
			if partnerEmail, ok := connData["partnerEmail"].(string); ok {
				partnerDocs, _ := fsClient.Collection("users").Where("email", "==", partnerEmail).Limit(1).Documents(ctx).GetAll()
				if len(partnerDocs) > 0 {
					partnerID := partnerDocs[0].Ref.ID
					fsClient.Collection("users").Doc(partnerID).Collection("connections").Doc(connDoc.Ref.ID).Delete(ctx)
				}
			}
		}
	}

	// deleting a document does not delete its subcollections
	// for a full cleanup you would need to recursively delete all documents in all subcollections
	// cause Firestore does not support deleting a document with subcollections in one go
	// this is a simplified cleanup for the connections.

	// delete user document from users collection
	_, err = fsClient.Collection("users").Doc(uidStr).Delete(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user document from database"})
		return
	}

	// clear session
	session.Clear()
	session.Save()

	// clear cookie
	c.SetCookie("session", "", -1, "/", "", true, true)

	c.JSON(http.StatusOK, gin.H{"message": "User account deleted successfully"})
}
