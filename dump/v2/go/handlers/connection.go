package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"

	"calple/util"
)

type Invitation struct {
	ID        string    `json:"id"`
	FromEmail string    `json:"from_email"`
	FromName  string    `json:"from_name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

// get active connection for current user
func GetConnection(c *gin.Context) {
	// check session for user ID
	// to check if user is logged in
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// get firestore client from context
	// this should be set in main.go when initializing the app
	// before calling this handler
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// find active connection in the user's subcollection
	conns, _ := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").Where("status", "==", "active").Documents(context.Background()).GetAll()

	// if still no connections found, return false
	if len(conns) == 0 {
		c.JSON(http.StatusOK, gin.H{"connected": false})
		return
	}

	// if there are multiple connections, return the first one
	conn := conns[0]
	data := conn.Data()

	partnerEmail, ok := data["partnerEmail"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid connection data"})
		return
	}

	// fetch partner info
	partnerDocs, _ := fsClient.Collection("users").Where("email", "==", partnerEmail).Documents(context.Background()).GetAll()
	var partnerInfo map[string]interface{}
	if len(partnerDocs) > 0 {
		partnerInfo = partnerDocs[0].Data()
		// removing sensitive data
		delete(partnerInfo, "passwordHash")
	}

	c.JSON(http.StatusOK, gin.H{
		"connected":    true,
		"connectionId": conn.Ref.ID,
		"partner":      partnerInfo,
	})
}

// invite a connection by user email
// this creates a pending connection that the other user can accept
// if the connection already exists, return an error
func InviteConnection(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	fsClient := c.MustGet("firestore").(*firestore.Client)
	userDoc, _ := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	userEmail := userDoc.Data()["email"].(string)

	// parse request body
	// expecting JSON body with email field
	var body struct {
		Email string `json:"email" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// validate email format
	if !util.IsValidEmail(body.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
		return
	}

	// normalize email to lowercase and trim whitespace
	// to avoid case sensitivity issues
	target := strings.ToLower(strings.TrimSpace(body.Email))
	if target == userEmail {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot connect to yourself"})
		return
	}

	// check if target user exists
	targets, _ := fsClient.Collection("users").Where("email", "==", target).Documents(context.Background()).GetAll()
	if len(targets) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	targetUser := targets[0]
	targetID := targetUser.Ref.ID

	// check if connection already exists in either user's subcollection
	existing, _ := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").Where("partnerEmail", "==", target).Documents(context.Background()).GetAll()
	if len(existing) > 0 {
		status := existing[0].Data()["status"].(string)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Connection %s already", status)})
		return
	}

	// create a new connection document in both users' subcollections
	now := time.Now()
	initiatorConnRef := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").NewDoc()

	err := fsClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
		// document for initiator
		if err := tx.Set(initiatorConnRef, map[string]interface{}{
			"partnerEmail": target,
			"role":         "initiator", // user1
			"status":       "pending",
			"createdAt":    now,
			"updatedAt":    now,
		}); err != nil {
			return err
		}

		// document for target
		targetConnRef := fsClient.Collection("users").Doc(targetID).Collection("connections").Doc(initiatorConnRef.ID)
		return tx.Set(targetConnRef, map[string]interface{}{
			"partnerEmail": userEmail,
			"role":         "receiver", // user2
			"status":       "pending",
			"createdAt":    now,
			"updatedAt":    now,
		})
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send invitation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation sent", "connectionId": initiatorConnRef.ID})
}

// list invitation for current user
// this returns all pending invitations where the user is user2
func GetPendingInvitations(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// find all pending connections where the current user is the receiver
	pending, _ := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").Where("status", "==", "pending").Documents(context.Background()).GetAll()
	invites := []Invitation{}

	// iterate over pending connections and build the response
	for _, doc := range pending {
		data := doc.Data()
		inviter := data["partnerEmail"].(string)
		userDocs, _ := fsClient.Collection("users").Where("email", "==", inviter).Documents(context.Background()).GetAll()
		inviterName := ""
		if len(userDocs) > 0 {
			inviterName = userDocs[0].Data()["name"].(string)
		}
		invites = append(invites, Invitation{
			ID:        doc.Ref.ID,
			FromEmail: inviter,
			FromName:  inviterName,
			Role:      data["role"].(string),
			CreatedAt: data["createdAt"].(time.Time),
		})
	}
	c.JSON(http.StatusOK, gin.H{"invitations": invites})
}

// accpet invitation and activate the connection
// this updates the connection status to "active"
// access to each others events as well
func AcceptInvitation(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	fsClient := c.MustGet("firestore").(*firestore.Client)
	userDoc, _ := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	userEmail := userDoc.Data()["email"].(string)

	// get the connection from the current user's subcollection
	connID := c.Param("id")
	connRef := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").Doc(connID)
	connSnap, err := connRef.Get(context.Background())
	// check if connection exists
	if err != nil || !connSnap.Exists() {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	data := connSnap.Data()
	// check if user is the receiver of the invitation
	if data["role"].(string) != "receiver" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	inviterEmail := data["partnerEmail"].(string)
	// find inviter's user document to get their ID
	inviterDocs, _ := fsClient.Collection("users").Where("email", "==", inviterEmail).Documents(context.Background()).GetAll()
	if len(inviterDocs) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Inviting user not found"})
		return
	}
	inviterID := inviterDocs[0].Ref.ID

	// using transaction to update both connection documents atomically
	now := time.Now()
	err = fsClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
		// update the current user's connection document
		if err := tx.Update(connRef, []firestore.Update{
			{Path: "status", Value: "active"},
			{Path: "updatedAt", Value: now},
			{Path: "partnerUID", Value: inviterID},
		}); err != nil {
			return err
		}

		// update the inviter's connection document
		inviterConnRef := fsClient.Collection("users").Doc(inviterID).Collection("connections").Doc(connID)
		return tx.Update(inviterConnRef, []firestore.Update{
			{Path: "status", Value: "active"},
			{Path: "updatedAt", Value: now},
			{Path: "partnerUID", Value: uid.(string)},
		})
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to accept invitation"})
		return
	}

	// give access to each others events
	// = add the userEmail to the connectedUsers array in each others events
	// inviters events
	it1, _ := fsClient.Collection("ddays").Where("createdBy", "==", inviterEmail).Documents(context.Background()).GetAll()
	for _, doc := range it1 {
		d := doc.Data()
		users := util.ToStringSlice(d["connectedUsers"])
		if !util.Contains(users, userEmail) {
			users = append(users, userEmail)
			fsClient.Collection("ddays").Doc(doc.Ref.ID).Update(context.Background(), []firestore.Update{{Path: "connectedUsers", Value: users}})
		}
	}

	// invitees events
	it2, _ := fsClient.Collection("ddays").Where("createdBy", "==", userEmail).Documents(context.Background()).GetAll()
	for _, doc := range it2 {
		d := doc.Data()
		users := util.ToStringSlice(d["connectedUsers"])
		if !util.Contains(users, inviterEmail) {
			users = append(users, inviterEmail)
			fsClient.Collection("ddays").Doc(doc.Ref.ID).Update(context.Background(), []firestore.Update{{Path: "connectedUsers", Value: users}})
		}
	}
	c.JSON(http.StatusOK, gin.H{"message": "Invitation accepted"})
}

// reject/remote the invitation
// delete the connection document
// and remove access from each others events
func RejectInvitation(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	fsClient := c.MustGet("firestore").(*firestore.Client)
	userDoc, _ := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	userEmail := userDoc.Data()["email"].(string)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	connID := c.Param("id")
	// get connection from the current user's subcollection
	connRef := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").Doc(connID)
	connSnap, err := connRef.Get(context.Background())
	if err != nil || !connSnap.Exists() {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}
	data := connSnap.Data()
	partnerEmail := data["partnerEmail"].(string)

	var user1, user2 string
	if data["role"].(string) == "initiator" {
		user1 = userEmail
		user2 = partnerEmail
	} else {
		user1 = partnerEmail
		user2 = userEmail
	}

	// remove access from each others events
	// remove userEmail from connectedUsers array in each other's events
	removeFromEvents := func(owner, target string) {
		docs, _ := fsClient.Collection("ddays").Where("createdBy", "==", owner).Documents(context.Background()).GetAll()
		for _, doc := range docs {
			d := doc.Data()
			users := util.ToStringSlice(d["connectedUsers"])
			if util.Contains(users, target) {
				users = util.Remove(users, target)
				fsClient.Collection("ddays").Doc(doc.Ref.ID).Update(context.Background(), []firestore.Update{{Path: "connectedUsers", Value: users}})
			}
		}
	}
	removeFromEvents(user1, user2)
	removeFromEvents(user2, user1)

	// find partner's user document to get ID
	partnerDocs, _ := fsClient.Collection("users").Where("email", "==", partnerEmail).Documents(context.Background()).GetAll()
	if len(partnerDocs) == 0 {
		// Partner not found, just delete current user's doc
		connRef.Delete(context.Background())
		c.JSON(http.StatusOK, gin.H{"message": "Connection removed"})
		return
	}
	partnerID := partnerDocs[0].Ref.ID

	// delete the connection document from both users' subcollections atomically
	err = fsClient.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
		// current user's connection doc
		if err := tx.Delete(connRef); err != nil {
			return err
		}

		// partner's connection doc
		partnerConnRef := fsClient.Collection("users").Doc(partnerID).Collection("connections").Doc(connID)
		return tx.Delete(partnerConnRef)
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove connection"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Connection removed"})
}
