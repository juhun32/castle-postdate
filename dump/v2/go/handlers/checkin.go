package handlers

import (
	"calple/util"
	"context"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// CheckinData represents a daily checkin entry
type CheckinData struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	Date         string    `json:"date"`
	Mood         string    `json:"mood"`
	Energy       string    `json:"energy"`
	PeriodStatus string    `json:"periodStatus"`
	SexualMood   string    `json:"sexualMood"`
	Note         string    `json:"note"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type PartnerCheckin struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	UserName     string    `json:"userName"`
	UserEmail    string    `json:"userEmail"`
	UserSex      string    `json:"userSex"`
	Date         string    `json:"date"`
	Mood         string    `json:"mood"`
	Energy       string    `json:"energy"`
	PeriodStatus string    `json:"periodStatus"`
	SexualMood   string    `json:"sexualMood"`
	Note         string    `json:"note"`
	CreatedAt    time.Time `json:"createdAt"`
}

func CreateCheckin(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	var checkinData CheckinData
	if err := c.ShouldBindJSON(&checkinData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if checkinData.Date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date is required"})
		return
	}

	if checkinData.Mood == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Mood is required"})
		return
	}

	if checkinData.Energy == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Energy is required"})
		return
	}

	// YYYY-MM-DD format validation
	if len(checkinData.Date) != 10 || checkinData.Date[4] != '-' || checkinData.Date[7] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	userID := uid.(string)

	existingDocs, err := fsClient.Collection("users").Doc(userID).Collection("checkins").
		Where("date", "==", checkinData.Date).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing checkin"})
		return
	}

	now := time.Now()
	var docRef *firestore.DocumentRef

	if len(existingDocs) > 0 {
		docRef = existingDocs[0].Ref
	} else {
		docRef = fsClient.Collection("users").Doc(userID).Collection("checkins").NewDoc()
	}

	firestoreData := map[string]interface{}{
		"userId":    userID,
		"date":      checkinData.Date,
		"mood":      checkinData.Mood,
		"energy":    checkinData.Energy,
		"updatedAt": now,
	}

	if checkinData.PeriodStatus != "" {
		firestoreData["periodStatus"] = checkinData.PeriodStatus
	}
	if checkinData.SexualMood != "" {
		firestoreData["sexualMood"] = checkinData.SexualMood
	}
	if checkinData.Note != "" {
		firestoreData["note"] = checkinData.Note
	}

	if len(existingDocs) == 0 {
		firestoreData["createdAt"] = now
	} else {
		firestoreData["createdAt"] = existingDocs[0].Data()["createdAt"]
	}

	_, err = docRef.Set(ctx, firestoreData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save checkin"})
		return
	}

	savedDoc, err := docRef.Get(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch saved checkin"})
		return
	}

	savedData := savedDoc.Data()
	createdAt := now
	if savedData["createdAt"] != nil {
		createdAt = savedData["createdAt"].(time.Time)
	}

	responseCheckin := CheckinData{
		ID:           docRef.ID,
		UserID:       userID,
		Date:         savedData["date"].(string),
		Mood:         savedData["mood"].(string),
		Energy:       savedData["energy"].(string),
		PeriodStatus: util.GetStringValue(savedData, "periodStatus"),
		SexualMood:   util.GetStringValue(savedData, "sexualMood"),
		Note:         util.GetStringValue(savedData, "note"),
		CreatedAt:    createdAt,
		UpdatedAt:    savedData["updatedAt"].(time.Time),
	}

	c.JSON(http.StatusOK, gin.H{"checkin": responseCheckin})
}

func GetTodayCheckin(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required"})
		return
	}

	// YYYY-MM-DD format validation
	if len(date) != 10 || date[4] != '-' || date[7] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	userID := uid.(string)

	checkinDocs, err := fsClient.Collection("users").Doc(userID).Collection("checkins").
		Where("date", "==", date).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch checkin data"})
		return
	}

	if len(checkinDocs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Checkin not found for the specified date"})
		return
	}

	data := checkinDocs[0].Data()
	createdAt := time.Now()
	if data["createdAt"] != nil {
		createdAt = data["createdAt"].(time.Time)
	}

	checkin := CheckinData{
		ID:           checkinDocs[0].Ref.ID,
		UserID:       userID,
		Date:         data["date"].(string),
		Mood:         data["mood"].(string),
		Energy:       data["energy"].(string),
		PeriodStatus: util.GetStringValue(data, "periodStatus"),
		SexualMood:   util.GetStringValue(data, "sexualMood"),
		Note:         util.GetStringValue(data, "note"),
		CreatedAt:    createdAt,
		UpdatedAt:    data["updatedAt"].(time.Time),
	}

	c.JSON(http.StatusOK, gin.H{"checkin": checkin})
}

func GetPartnerCheckin(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required"})
		return
	}

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

	// decided to use partner's email to fetch their checkin,
	// this is more reliable cause partner's id can change if they delete their account
	partnerUserDocs, err := fsClient.Collection("users").
		Where("email", "==", partnerEmail).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner user info"})
		return
	}

	if len(partnerUserDocs) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner user info"})
		return
	}

	partnerUserData := partnerUserDocs[0].Data()
	partnerName := partnerUserData["name"].(string)
	partnerID := partnerUserDocs[0].Ref.ID

	partnerSex := ""
	if partnerUserData["sex"] != nil {
		partnerSex = partnerUserData["sex"].(string)
	}

	checkinDocs, err := fsClient.Collection("users").Doc(partnerID).Collection("checkins").
		Where("date", "==", date).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner checkin"})
		return
	}

	if len(checkinDocs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Partner checkin not found"})
		return
	}

	data := checkinDocs[0].Data()

	// optional timestamp fields
	createdAt := time.Now()
	if data["createdAt"] != nil {
		createdAt = data["createdAt"].(time.Time)
	}

	partnerCheckin := PartnerCheckin{
		ID:           checkinDocs[0].Ref.ID,
		UserID:       partnerID,
		UserName:     partnerName,
		UserEmail:    partnerEmail,
		UserSex:      partnerSex,
		Date:         data["date"].(string),
		Mood:         data["mood"].(string),
		Energy:       data["energy"].(string),
		PeriodStatus: util.GetStringValue(data, "periodStatus"),
		SexualMood:   util.GetStringValue(data, "sexualMood"),
		Note:         util.GetStringValue(data, "note"),
		CreatedAt:    createdAt,
	}

	c.JSON(http.StatusOK, gin.H{"partnerCheckin": partnerCheckin})
}

func DeleteCheckin(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required"})
		return
	}

	// YYYY-MM-DD
	if len(date) != 10 || date[4] != '-' || date[7] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	userID := uid.(string)

	// find the checkin document for the specified date
	checkinDocs, err := fsClient.Collection("users").Doc(userID).Collection("checkins").
		Where("date", "==", date).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch checkin data"})
		return
	}

	if len(checkinDocs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Checkin not found for the specified date"})
		return
	}

	// delete checkin document
	checkinDoc := checkinDocs[0]
	_, err = checkinDoc.Ref.Delete(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete checkin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Checkin deleted successfully"})
}
