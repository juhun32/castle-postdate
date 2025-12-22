package handlers

import (
	"context"
	"net/http"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
)

type Roulette struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// getAllpost; returns all posts from the database
// IMPORTANT: auth shouldn't be required for this endpoint
// so that users can see posts without logging in
func GetIdeaRoulette(c *gin.Context) {
	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	q1, err := fsClient.Collection("roulette").Documents(context.Background()).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	ideas := []Roulette{}
	for _, doc := range q1 {
		var roulette Roulette
		if err := doc.DataTo(&roulette); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse post data"})
			return
		}
		roulette.ID = doc.Ref.ID
		ideas = append(ideas, roulette)
	}

	c.JSON(http.StatusOK, ideas)
}

// addIdeaRoulette; adds a new idea to the roulette
func AddIdeaRoulette(c *gin.Context) {
	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	var roulette Roulette
	if err := c.ShouldBindJSON(&roulette); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// add the new idea to the database
	docRef, _, err := fsClient.Collection("roulette").Add(context.Background(), roulette)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add idea"})
		return
	}

	roulette.ID = docRef.ID
	c.JSON(http.StatusCreated, roulette)
}

// deleteIdeaRoulette; deletes an idea from the roulette
func DeleteIdeaRoulette(c *gin.Context) {
	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get the ID from the URL parameter
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
		return
	}

	// delete the idea from the database
	_, err := fsClient.Collection("roulette").Doc(id).Delete(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete idea"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Idea deleted successfully"})
}

// editIdeaRoulette; edits an existing idea in the roulette
func EditIdeaRoulette(c *gin.Context) {
	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get the ID from the URL parameter
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
		return
	}

	var roulette Roulette
	if err := c.ShouldBindJSON(&roulette); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// update the idea in the database
	_, err := fsClient.Collection("roulette").Doc(id).Set(context.Background(), roulette)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update idea"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Idea updated successfully"})
}
