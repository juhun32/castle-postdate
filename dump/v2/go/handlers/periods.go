package handlers

import (
	"calple/util"
	"context"
	"fmt"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type PeriodDay struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	Date           string    `json:"date"`
	IsPeriod       bool      `json:"isPeriod"`
	Symptoms       []string  `json:"symptoms"`
	CrampIntensity int64     `json:"crampIntensity"`
	Mood           []string  `json:"mood"`
	Activities     []string  `json:"activities"`
	SexActivity    []string  `json:"sexActivity"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type CycleSettings struct {
	ID           string    `json:"id"`
	UserID       string    `json:"userId"`
	CycleLength  int64     `json:"cycleLength"`
	PeriodLength int64     `json:"periodLength"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func GetPeriodDays(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	docs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("periodDays").
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch period days"})
		return
	}

	periodDays := []PeriodDay{}
	for _, doc := range docs {
		data := doc.Data()

		var crampIntensity int64
		if val, ok := data["crampIntensity"]; ok {
			if intensity, ok := val.(int64); ok {
				crampIntensity = intensity
			}
		}

		periodDays = append(periodDays, PeriodDay{
			ID:             doc.Ref.ID,
			UserID:         uid.(string),
			Date:           data["date"].(string),
			IsPeriod:       data["isPeriod"].(bool),
			Symptoms:       util.ToStringSlice(data["symptoms"]),
			CrampIntensity: crampIntensity,
			Mood:           util.ToStringSlice(data["mood"]),
			Activities:     util.ToStringSlice(data["activities"]),
			SexActivity:    util.ToStringSlice(data["sexActivity"]),
			Notes:          data["notes"].(string),
			CreatedAt:      data["createdAt"].(time.Time),
			UpdatedAt:      data["updatedAt"].(time.Time),
		})
	}

	c.JSON(http.StatusOK, gin.H{"periodDays": periodDays})
}

func GetPartnerPeriodDays(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	userDoc, err := fsClient.Collection("users").Doc(uid.(string)).Get(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	userEmail := userDoc.Data()["email"].(string)

	connectionDocs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").
		Where("status", "==", "active").
		Documents(ctx).GetAll()

	if err != nil || len(connectionDocs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active connection found"})
		return
	}

	connectionData := connectionDocs[0].Data()
	partnerEmail := connectionData["partnerEmail"].(string)

	partnerDocs, err := fsClient.Collection("users").
		Where("email", "==", partnerEmail).
		Documents(ctx).GetAll()

	if err != nil || len(partnerDocs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Partner not found"})
		return
	}

	partnerUID := partnerDocs[0].Ref.ID
	fmt.Printf("DEBUG: GetPartnerPeriodDays - userEmail: %s, partnerEmail: %s, partnerUID: %s\n", userEmail, partnerEmail, partnerUID)

	var userSex string
	userDoc, userErr := fsClient.Collection("users").Doc(uid.(string)).Get(ctx)
	if userErr == nil {
		if sex, ok := userDoc.Data()["sex"].(string); ok {
			userSex = sex
		}
	}

	var partnerSex string
	partnerDoc, partnerErr := fsClient.Collection("users").Doc(partnerUID).Get(ctx)
	if partnerErr == nil {
		if sex, ok := partnerDoc.Data()["sex"].(string); ok {
			partnerSex = sex
		}
	}

	fmt.Printf("DEBUG: User sex: %s, Partner sex: %s\n", userSex, partnerSex)

	docs, err := fsClient.Collection("users").Doc(partnerUID).Collection("periodDays").
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch partner period days"})
		return
	}

	fmt.Printf("DEBUG: Found %d partner period days\n", len(docs))

	periodDays := []PeriodDay{}
	for _, doc := range docs {
		data := doc.Data()

		var crampIntensity int64
		if val, ok := data["crampIntensity"]; ok {
			if intensity, ok := val.(int64); ok {
				crampIntensity = intensity
			}
		}

		periodDays = append(periodDays, PeriodDay{
			ID:             doc.Ref.ID,
			UserID:         partnerUID,
			Date:           data["date"].(string),
			IsPeriod:       data["isPeriod"].(bool),
			Symptoms:       util.ToStringSlice(data["symptoms"]),
			CrampIntensity: crampIntensity,
			Mood:           util.ToStringSlice(data["mood"]),
			Activities:     util.ToStringSlice(data["activities"]),
			SexActivity:    util.ToStringSlice(data["sexActivity"]),
			Notes:          data["notes"].(string),
			CreatedAt:      data["createdAt"].(time.Time),
			UpdatedAt:      data["updatedAt"].(time.Time),
		})
	}

	fmt.Printf("DEBUG: Returning %d period days\n", len(periodDays))

	c.JSON(http.StatusOK, gin.H{
		"periodDays": periodDays,
		"partnerSex": userSex,
	})
}

func CreatePeriodDay(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	var periodDay PeriodDay
	if err := c.ShouldBindJSON(&periodDay); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if len(periodDay.Date) != 10 || periodDay.Date[4] != '-' || periodDay.Date[7] != '-' {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
		return
	}

	existingDocs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("periodDays").
		Where("date", "==", periodDay.Date).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing period day"})
		return
	}

	if len(existingDocs) > 0 {
		updateData := map[string]interface{}{
			"isPeriod":       periodDay.IsPeriod,
			"symptoms":       periodDay.Symptoms,
			"mood":           periodDay.Mood,
			"crampIntensity": periodDay.CrampIntensity,
			"activities":     periodDay.Activities,
			"sexActivity":    periodDay.SexActivity,
			"notes":          periodDay.Notes,
			"updatedAt":      time.Now(),
		}

		_, err = existingDocs[0].Ref.Set(ctx, updateData, firestore.MergeAll)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update period day"})
			return
		}

		updatedDoc, err := existingDocs[0].Ref.Get(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated period day"})
			return
		}

		var updatedPeriodDay PeriodDay
		updatedDoc.DataTo(&updatedPeriodDay)
		updatedPeriodDay.ID = updatedDoc.Ref.ID
		updatedPeriodDay.UserID = uid.(string)

		c.JSON(http.StatusOK, updatedPeriodDay)
		return
	}

	now := time.Now()
	docRef, _, err := fsClient.Collection("users").Doc(uid.(string)).Collection("periodDays").Add(ctx, map[string]interface{}{
		"date":           periodDay.Date,
		"isPeriod":       periodDay.IsPeriod,
		"symptoms":       periodDay.Symptoms,
		"crampIntensity": periodDay.CrampIntensity,
		"mood":           periodDay.Mood,
		"activities":     periodDay.Activities,
		"sexActivity":    periodDay.SexActivity,
		"notes":          periodDay.Notes,
		"createdAt":      now,
		"updatedAt":      now,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create period day"})
		return
	}

	c.JSON(http.StatusCreated, PeriodDay{
		ID:             docRef.ID,
		UserID:         uid.(string),
		Date:           periodDay.Date,
		IsPeriod:       periodDay.IsPeriod,
		Symptoms:       periodDay.Symptoms,
		CrampIntensity: periodDay.CrampIntensity,
		Mood:           periodDay.Mood,
		Activities:     periodDay.Activities,
		SexActivity:    periodDay.SexActivity,
		Notes:          periodDay.Notes,
		CreatedAt:      now,
		UpdatedAt:      now,
	})
}

func DeletePeriodDay(c *gin.Context) {
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

	docs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("periodDays").
		Where("date", "==", date).
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find period day"})
		return
	}

	if len(docs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Period day not found"})
		return
	}

	_, err = docs[0].Ref.Delete(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete period day"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Period day deleted successfully"})
}

func GetCycleSettings(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	docs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("cycleSettings").
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cycle settings"})
		return
	}

	if len(docs) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"cycleSettings": CycleSettings{
				UserID:       uid.(string),
				CycleLength:  28,
				PeriodLength: 5,
			},
		})
		return
	}

	data := docs[0].Data()
	settings := CycleSettings{
		ID:           docs[0].Ref.ID,
		UserID:       uid.(string),
		CycleLength:  int64(data["cycleLength"].(int64)),
		PeriodLength: int64(data["periodLength"].(int64)),
		CreatedAt:    data["createdAt"].(time.Time),
		UpdatedAt:    data["updatedAt"].(time.Time),
	}

	c.JSON(http.StatusOK, gin.H{"cycleSettings": settings})
}

func UpdateCycleSettings(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	var settings CycleSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if settings.CycleLength < 20 || settings.CycleLength > 45 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cycle length must be between 20 and 45 days"})
		return
	}

	if settings.PeriodLength < 1 || settings.PeriodLength > 10 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Period length must be between 1 and 10 days"})
		return
	}

	docs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("cycleSettings").
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing settings"})
		return
	}

	now := time.Now()
	if len(docs) > 0 {
		_, err = docs[0].Ref.Update(ctx, []firestore.Update{
			{Path: "cycleLength", Value: settings.CycleLength},
			{Path: "periodLength", Value: settings.PeriodLength},
			{Path: "updatedAt", Value: now},
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cycle settings"})
			return
		}
	} else {
		docRef, _, err := fsClient.Collection("users").Doc(uid.(string)).Collection("cycleSettings").Add(ctx, map[string]interface{}{
			"cycleLength":  settings.CycleLength,
			"periodLength": settings.PeriodLength,
			"createdAt":    now,
			"updatedAt":    now,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cycle settings"})
			return
		}
		settings.ID = docRef.ID
	}

	settings.UserID = uid.(string)
	settings.UpdatedAt = now

	c.JSON(http.StatusOK, gin.H{"cycleSettings": settings})
}

func DebugConnection(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)
	ctx := context.Background()

	userDoc, err := fsClient.Collection("users").Doc(uid.(string)).Get(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user data"})
		return
	}
	userEmail := userDoc.Data()["email"].(string)

	connectionDocs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").
		Where("status", "==", "active").
		Documents(ctx).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch connections"})
		return
	}

	debugInfo := map[string]interface{}{
		"userId":        uid.(string),
		"userEmail":     userEmail,
		"hasConnection": len(connectionDocs) > 0,
	}

	if len(connectionDocs) > 0 {
		connectionData := connectionDocs[0].Data()
		debugInfo["connection"] = connectionData
		debugInfo["connectionId"] = connectionDocs[0].Ref.ID
	}

	c.JSON(http.StatusOK, debugInfo)
}
