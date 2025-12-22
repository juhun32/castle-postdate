package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"cloud.google.com/go/firestore"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"

	"github.com/google/uuid"

	"calple/util"
)

type DDay struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Group          string    `json:"group"`
	Description    string    `json:"description"`
	Date           string    `json:"date,omitempty"`
	EndDate        string    `json:"endDate,omitempty"`
	ImageURL       string    `json:"imageUrl,omitempty"`
	IsAnnual       bool      `json:"isAnnual"`
	CreatedBy      string    `json:"createdBy"`
	ConnectedUsers []string  `json:"connectedUsers"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Editable       bool      `json:"editable,omitempty"` // if the event can be edited by the user
}

type UploadRequest struct {
	FileSize int64 `json:"fileSize"`
}

// fetch all events for the current user
func GetDDays(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// user email from firestore
	userDoc, err := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	userEmail := userDoc.Data()["email"].(string)

	// parse view date from query params
	viewDate := c.Query("view")
	// ex) "202507"

	if viewDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing view date parameter"})
		return
	}

	ctx := context.Background()
	events := []DDay{}
	seen := make(map[string]bool)

	// 1. query for all events that START before the END of the viewed month.
	// 2. manually filter out events that also END before the START of the month.
	// reason: firestore "one range filter per query" limitation

	year, _ := strconv.Atoi(viewDate[0:4])
	month, _ := strconv.Atoi(viewDate[4:6])

	// first day of the viewed month ex) "20250601"
	viewMonthStartStr := viewDate + "01"

	// last day of the viewed month ex) "20250630"
	lastDayOfMonth := time.Date(year, time.Month(month)+1, 0, 0, 0, 0, 0, time.UTC).Day()
	viewMonthEndStr := fmt.Sprintf("%s%02d", viewDate, lastDayOfMonth)

	fmt.Printf("DEBUG: GetDDays - userEmail: %s, viewMonthStartStr: %s, viewMonthEndStr: %s\n", userEmail, viewMonthStartStr, viewMonthEndStr)

	// debug: if user has any active connections
	connectionDocs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").
		Where("status", "==", "active").
		Documents(ctx).GetAll()

	if err == nil && len(connectionDocs) > 0 {
		connectionData := connectionDocs[0].Data()
		partnerEmail := connectionData["partnerEmail"].(string)
		fmt.Printf("DEBUG: User %s has active connection with %s\n", userEmail, partnerEmail)
	} else {
		fmt.Printf("DEBUG: User %s has no active connections\n", userEmail)
	}

	queries := []firestore.Query{
		// Q1: events created by the user that start before the end of the month
		fsClient.Collection("ddays").
			Where("createdBy", "==", userEmail).
			Where("date", "<=", viewMonthEndStr),

		// Q2: events the user is connected to that start before the end of the month
		fsClient.Collection("ddays").
			Where("connectedUsers", "array-contains", userEmail).
			Where("date", "<=", viewMonthEndStr),

		// Q3: annual events created by the user
		fsClient.Collection("ddays").
			Where("createdBy", "==", userEmail).
			Where("isAnnual", "==", true),
	}

	for i, q := range queries {
		docs, err := q.Documents(ctx).GetAll()
		if err != nil {
			fmt.Printf("ERROR: Firestore query failed: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events from database."})
			return // stop execution if a query fails
		}
		fmt.Printf("DEBUG: Query %d found %d documents\n", i+1, len(docs))

		// debug: show details of each event found
		for _, doc := range docs {
			data := doc.Data()
			title, _ := data["title"].(string)
			createdBy, _ := data["createdBy"].(string)
			connectedUsers := util.ToStringSlice(data["connectedUsers"])
			fmt.Printf("DEBUG: Event '%s' - createdBy: %s, connectedUsers: %v\n", title, createdBy, connectedUsers)
		}

		for _, doc := range docs {
			if seen[doc.Ref.ID] {
				continue
			}

			data := doc.Data()
			dateStr, _ := data["date"].(string)
			endDateStr, _ := data["endDate"].(string)
			if endDateStr == "" {
				endDateStr = dateStr
			}

			var isAnnual bool
			if val, ok := data["isAnnual"].(bool); ok {
				isAnnual = val
			}

			if isAnnual {
				// only compare month for annual events ignore year and endDate filter
				if len(dateStr) >= 8 && len(viewDate) >= 6 {
					if dateStr[4:6] != viewDate[4:6] {
						continue
					}
				}
			} else {
				// filter out events that end before our view starts.
				// event is visible if its end date is on or after the first day of the month.
				// endDateStr != "" is for undated events it needs this to be visible from client side
				if endDateStr != "" && endDateStr < viewMonthStartStr {
					continue
				}
			}

			seen[doc.Ref.ID] = true

			title, _ := data["title"].(string)
			group, _ := data["group"].(string)
			description, _ := data["description"].(string)
			imageUrl, _ := data["imageUrl"].(string)
			createdBy, _ := data["createdBy"].(string)
			var createdAt, updatedAt time.Time
			if ct, ok := data["createdAt"].(time.Time); ok {
				createdAt = ct
			}
			if ut, ok := data["updatedAt"].(time.Time); ok {
				updatedAt = ut
			}

			connectedUsers := util.ToStringSlice(data["connectedUsers"])
			fmt.Printf("DEBUG: Event '%s' - createdBy: %s, connectedUsers: %v\n", title, createdBy, connectedUsers)

			editable := true
			if val, ok := data["editable"]; ok {
				if b, ok := val.(bool); ok {
					editable = b
				}
			}

			events = append(events, DDay{
				ID:             doc.Ref.ID,
				Title:          title,
				Group:          group,
				Description:    description,
				Date:           dateStr,
				EndDate:        endDateStr,
				ImageURL:       imageUrl,
				IsAnnual:       isAnnual,
				CreatedBy:      createdBy,
				ConnectedUsers: connectedUsers,
				CreatedAt:      createdAt,
				UpdatedAt:      updatedAt,
				Editable:       editable,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"ddays": events,
		"date":  viewDate,
	})
}

// create new event
func CreateDDay(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get user email from firestore
	userDoc, err := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	userEmail := userDoc.Data()["email"].(string)

	// parse request body
	var dday DDay
	if err := c.ShouldBindJSON(&dday); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if dday.Date != "" {
		// validate date format
		// expected format: YYYYMMDD
		if len(dday.Date) != 8 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYYMMDD"})
			fmt.Println("Invalid date format:", dday.Date)
			return
		}
		_, err1 := strconv.Atoi(dday.Date[0:4])
		month, err2 := strconv.Atoi(dday.Date[4:6])
		day, err3 := strconv.Atoi(dday.Date[6:8])
		if err1 != nil || err2 != nil || err3 != nil || month < 1 || month > 12 || day < 1 || day > 31 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date values"})
			return
		}
	}

	// validate title
	if dday.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	fmt.Printf("DEBUG: CreateDDay - userEmail: %s, original connectedUsers: %v\n", userEmail, dday.ConnectedUsers)

	connectedUsers := dday.ConnectedUsers
	connectionDocs, err := fsClient.Collection("users").Doc(uid.(string)).Collection("connections").
		Where("status", "==", "active").
		Documents(context.Background()).GetAll()

	if err == nil && len(connectionDocs) > 0 {
		connectionData := connectionDocs[0].Data()
		partnerEmail := connectionData["partnerEmail"].(string)

		fmt.Printf("DEBUG: CreateDDay - found partner: %s\n", partnerEmail)

		// add partner to connectedUsers if not already present
		if !util.Contains(connectedUsers, partnerEmail) {
			connectedUsers = append(connectedUsers, partnerEmail)
			fmt.Printf("DEBUG: CreateDDay - added partner to connectedUsers: %v\n", connectedUsers)
		} else {
			fmt.Printf("DEBUG: CreateDDay - partner already in connectedUsers\n")
		}
	} else {
		fmt.Printf("DEBUG: CreateDDay - no active connection found\n")
	}

	// set current time for timestamps
	now := time.Now()

	fmt.Printf("DEBUG: CreateDDay - final connectedUsers: %v\n", connectedUsers)

	// create a new document in the ddays collection
	newDDay := map[string]interface{}{
		"title":          dday.Title,
		"group":          dday.Group,
		"description":    dday.Description,
		"date":           dday.Date,
		"endDate":        dday.EndDate,
		"imageUrl":       dday.ImageURL,
		"isAnnual":       dday.IsAnnual,
		"createdBy":      userEmail,
		"connectedUsers": connectedUsers,
		"createdAt":      now,
		"updatedAt":      now,
		"editable":       dday.Editable || true,
	}

	// add document to Firestore
	newDoc, _, err := fsClient.Collection("ddays").Add(context.Background(), newDDay)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event: " + err.Error()})
		return
	}

	// return created evetn
	dday.ID = newDoc.ID
	dday.CreatedBy = userEmail
	dday.CreatedAt = now
	dday.UpdatedAt = now

	c.JSON(http.StatusCreated, gin.H{"dday": dday})
}

// update existing event
func UpdateDDay(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get user email from firestore
	userDoc, err := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	userEmail := userDoc.Data()["email"].(string)

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if dateVal, ok := updates["date"]; ok {
		dateStr, isString := dateVal.(string)
		if !isString {
			c.JSON(http.StatusBadRequest, gin.H{"error": "date field must be a string"})
			return
		}
		// only validate non-empty date strings.
		if dateStr != "" {
			if len(dateStr) != 8 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYYMMDD"})
				return
			}
			_, err1 := strconv.Atoi(dateStr[0:4])
			month, err2 := strconv.Atoi(dateStr[4:6])
			day, err3 := strconv.Atoi(dateStr[6:8])
			if err1 != nil || err2 != nil || err3 != nil || month < 1 || month > 12 || day < 1 || day > 31 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date values"})
				return
			}
		}
	}

	if titleVal, ok := updates["title"]; ok {
		if titleStr, isString := titleVal.(string); !isString || titleStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title cannot be empty if provided"})
			return
		}
	}

	// get event ID from URL
	id := c.Param("id")
	ddayRef := fsClient.Collection("ddays").Doc(id)
	docSnap, err := ddayRef.Get(context.Background())
	if err != nil || !docSnap.Exists() {
		c.JSON(http.StatusNotFound, gin.H{"error": "D-Day not found"})
		return
	}
	if docSnap.Data()["createdBy"].(string) != userEmail {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only creator can update"})
		return
	}

	firestoreUpdates := []firestore.Update{}
	for key, value := range updates {
		// prevent users from updating protected fields
		if key == "id" || key == "createdBy" || key == "createdAt" {
			continue
		}
		firestoreUpdates = append(firestoreUpdates, firestore.Update{Path: key, Value: value})
	}
	// always update 'updatedAt' timestamp
	firestoreUpdates = append(firestoreUpdates, firestore.Update{Path: "updatedAt", Value: time.Now()})

	if _, err := ddayRef.Update(context.Background(), firestoreUpdates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event: " + err.Error()})
		return
	}

	updatedDoc, err := ddayRef.Get(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated event"})
		return
	}

	var updatedDDay DDay
	if err := updatedDoc.DataTo(&updatedDDay); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse updated event data"})
		return
	}
	updatedDDay.ID = updatedDoc.Ref.ID

	c.JSON(http.StatusOK, gin.H{"dday": updatedDDay})

}

// delete existing event
func DeleteDDay(c *gin.Context) {
	// get user ID from session
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)
	// get user email from firestore
	userDoc, _ := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	userEmail := userDoc.Data()["email"].(string)

	id := c.Param("id")
	ddayRef := fsClient.Collection("ddays").Doc(id)
	docSnap, err := ddayRef.Get(context.Background())
	if err != nil || !docSnap.Exists() {
		c.JSON(http.StatusNotFound, gin.H{"error": "D-Day not found"})
		return
	}
	if docSnap.Data()["createdBy"].(string) != userEmail {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only creator can delete"})
		return
	}
	if _, err := ddayRef.Delete(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "D-Day deleted"})
}

// generate presigned URL for upload to R2
func GetDDayUploadURL(c *gin.Context) {
	var req UploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: missing fileSize"})
		return
	}

	// maximum upload size (5MB)
	const maxUploadSize = 5 * 1024 * 1024

	// enforce the size limit on the backend before generating the URL
	if req.FileSize > maxUploadSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File size exceeds the 5MB limit"})
		return
	}

	accountID := os.Getenv("R2_ACCOUNT_ID")
	accessKeyID := os.Getenv("R2_ACCESS_KEY_ID")
	accessKeySecret := os.Getenv("R2_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("R2_BUCKET_NAME")

	// AWS config loader
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, accessKeySecret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to configure R2 client"})
		return
	}

	// create S3 client
	s3Client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
	})

	presignClient := s3.NewPresignClient(s3Client)

	// generate unique key (filename)
	objectKey := "ddays/" + uuid.New().String()

	presignedURL, err := presignClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
		// while PresignPutObject doesn't directly enforce a range,
		// the client MUST set the Content-Length header, which will be checked on the frontend
	}, s3.WithPresignExpires(time.Minute*15))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create presigned URL"})
		return
	}

	// public URL stored in firestore
	publicURL := fmt.Sprintf("https://pub-%s.r2.dev/%s", os.Getenv("R2_PUBLIC_BUCKET_ID"), objectKey)

	c.JSON(http.StatusOK, gin.H{
		"uploadUrl": presignedURL.URL,
		"publicUrl": publicURL,
	})
}
