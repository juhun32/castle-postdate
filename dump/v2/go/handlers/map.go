package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/iterator"
)

type Pin struct {
	ID          string    `json:"id" firestore:"-"`
	Lat         float64   `json:"lat" firestore:"lat"`
	Lng         float64   `json:"lng" firestore:"lng"`
	Title       string    `json:"title" firestore:"title"`
	Description string    `json:"description" firestore:"description"`
	Location    string    `json:"location" firestore:"location"`
	Date        string    `json:"date" firestore:"date"` // ISO yyyy-MM-dd
	CreatedAt   time.Time `json:"createdAt" firestore:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt" firestore:"updatedAt"`
}

type PinRequest struct {
	Lat         float64 `json:"lat" binding:"required"`
	Lng         float64 `json:"lng" binding:"required"`
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Location    string  `json:"location"`
	Date        string  `json:"date" binding:"required"` // YYYY-MM-DD
}

func GetPins(c *gin.Context) {
	session := sessions.Default(c)
	uidInter := session.Get("user_id")
	if uidInter == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := uidInter.(string)

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	// helper to load pins from a user's subcollection
	loadPins := func(userID string) ([]Pin, error) {
		snapIter := fsClient.Collection("users").Doc(userID).
			Collection("pins").
			OrderBy("createdAt", firestore.Desc).
			Documents(ctx)
		defer snapIter.Stop()

		var out []Pin
		for {
			doc, err := snapIter.Next()
			if err != nil {
				if err == iterator.Done {
					break
				}
				return nil, err
			}
			var p Pin
			if err := doc.DataTo(&p); err != nil {
				return nil, err
			}
			p.ID = doc.Ref.ID
			out = append(out, p)
		}
		return out, nil
	}

	// load own pins
	userPins, err := loadPins(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user pins"})
		return
	}

	// check for active partner
	connIter, err := fsClient.Collection("users").Doc(uid).
		Collection("connections").
		Where("status", "==", "active").
		Limit(1).
		Documents(ctx).
		GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query connections"})
		return
	}

	var partnerPins []Pin
	if len(connIter) > 0 {
		if partnerUID, ok := connIter[0].Data()["partnerUID"].(string); ok && partnerUID != "" {
			partnerPins, _ = loadPins(partnerUID)
		}
	}

	fmt.Printf("DEBUG: Loaded %d user pins and %d partner pins\n", len(userPins), len(partnerPins))

	c.JSON(http.StatusOK, gin.H{
		"pins":        userPins,
		"partnerPins": partnerPins,
	})
}

func CreatePin(c *gin.Context) {
	session := sessions.Default(c)
	uidInter := session.Get("user_id")
	if uidInter == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := uidInter.(string)

	var req PinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	now := time.Now()
	newPin := map[string]interface{}{
		"lat":         req.Lat,
		"lng":         req.Lng,
		"title":       req.Title,
		"description": req.Description,
		"location":    req.Location,
		"date":        req.Date,
		"createdAt":   now,
		"updatedAt":   now,
	}

	docRef, _, err := fsClient.Collection("users").
		Doc(uid).
		Collection("pins").
		Add(ctx, newPin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create pin"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": docRef.ID})
}

func UpdatePin(c *gin.Context) {
	session := sessions.Default(c)
	uidInter := session.Get("user_id")
	if uidInter == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := uidInter.(string)

	pinID := c.Param("id")
	var req PinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	updates := []firestore.Update{
		{Path: "lat", Value: req.Lat},
		{Path: "lng", Value: req.Lng},
		{Path: "title", Value: req.Title},
		{Path: "description", Value: req.Description},
		{Path: "location", Value: req.Location},
		{Path: "date", Value: req.Date},
		{Path: "updatedAt", Value: time.Now()},
	}

	_, err := fsClient.Collection("users").
		Doc(uid).
		Collection("pins").
		Doc(pinID).
		Update(ctx, updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update pin"})
		return
	}
	c.Status(http.StatusNoContent)
}

// DeletePin removes a pin by ID.
func DeletePin(c *gin.Context) {
	session := sessions.Default(c)
	uidInter := session.Get("user_id")
	if uidInter == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	uid := uidInter.(string)

	pinID := c.Param("id")
	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	_, err := fsClient.Collection("users").
		Doc(uid).
		Collection("pins").
		Doc(pinID).
		Delete(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete pin"})
		return
	}
	c.Status(http.StatusNoContent)
}
