package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"calple/firebase"
	"calple/handlers"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	env := os.Getenv("ENV")
	fmt.Println("ENV:", env)

	if os.Getenv("SECRET_KEY") == "" {
		panic("FATAL: SECRET_KEY environment variable is not set")
	}

	// create context
	ctx := context.Background()

	// initialize firestore client
	fsClient, err := firebase.InitFirebase(ctx)
	if err != nil {
		panic(err)
	}
	defer fsClient.Close()

	router := gin.Default()

	// trusted proxies for prod environment
	if os.Getenv("ENV") != "development" {
		router.SetTrustedProxies([]string{"0.0.0.0/0"})
	}

	// set gin mode for prod
	// in development mode, gin will log requests and errors
	// in production avoid logging requests for performance and security
	if os.Getenv("ENV") != "development" {
		gin.SetMode(gin.ReleaseMode)
	}

	// session
	store := cookie.NewStore([]byte(os.Getenv("SECRET_KEY")))
	store.Options(sessions.Options{
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("ENV") != "development",
		SameSite: func() http.SameSite {
			if os.Getenv("ENV") == "development" {
				return http.SameSiteLaxMode
			}
			return http.SameSiteNoneMode
		}(),
		Domain: func() string {
			if os.Getenv("ENV") == "development" {
				return ""
			}
			return ".calple.date"
		}(),
		MaxAge: 12 * 60 * 60,
	})
	router.Use(sessions.Sessions("calple_session", store))

	// CORS
	corsConfig := cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL"), "https://www.calple.date", "https://calple.date"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(corsConfig))

	// firestore into context
	// this middleware sets the firestore client in the context for use in handlers
	router.Use(func(c *gin.Context) {
		c.Set("firestore", fsClient)
		c.Next()
	})

	// logging middleware for debugging
	router.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		// process request
		c.Next()

		status := c.Writer.Status()
		latency := time.Since(start)

		fmt.Printf("DEBUG: %s %s - Status: %d, Latency: %v\n", method, path, status, latency)

		if status >= 400 {
			fmt.Printf("DEBUG: Error request - Method: %s, Path: %s, Status: %d, User-Agent: %s\n",
				method, path, status, c.Request.UserAgent())
		}
	})

	// auth routes
	router.GET("/google/oauth/login", handlers.Login)
	router.GET("/google/oauth/callback", handlers.Callback)
	router.GET("/api/auth/status", handlers.AuthStatus)
	router.GET("/google/oauth/logout", handlers.Logout)

	// health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":      "healthy",
			"timestamp":   time.Now().UTC(),
			"environment": os.Getenv("ENV"),
		})
	})

	// firebase connectivity test endpoint
	router.GET("/api/health/firebase", func(c *gin.Context) {
		fsClient := c.MustGet("firestore").(*firestore.Client)
		ctx := context.Background()

		// try to access Firestore to test connectivity
		_, err := fsClient.Collection("_health_check").Doc("test").Get(ctx)
		if err != nil {
			// this is expected to fail since the document doesn't exist
			if strings.Contains(err.Error(), "NotFound") {
				c.JSON(http.StatusOK, gin.H{
					"status":  "firebase_connected",
					"message": "Firebase connection is working (document not found is expected)",
				})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{
					"status": "firebase_error",
					"error":  err.Error(),
				})
			}
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":  "firebase_connected",
			"message": "Firebase connection is working",
		})
	})

	api := router.Group("/api")
	{
		// dday event routes
		api.GET("/ddays", handlers.GetDDays)
		api.POST("/ddays", handlers.CreateDDay)
		api.PUT("/ddays/:id", handlers.UpdateDDay)
		api.DELETE("/ddays/:id", handlers.DeleteDDay)
		api.POST("/ddays/upload-url", handlers.GetDDayUploadURL)

		// connection routes
		api.GET("/connection", handlers.GetConnection)
		api.POST("/connection/invite", handlers.InviteConnection)
		api.GET("/connection/pending", handlers.GetPendingInvitations)
		api.POST("/connection/:id/accept", handlers.AcceptInvitation)
		api.POST("/connection/:id/reject", handlers.RejectInvitation)

		// idea routes
		api.GET("/ideas/all", handlers.GetAllPosts)
		api.GET("/ideas", handlers.GetPost)
		api.POST("/ideas", handlers.AddPost)
		api.PUT("/ideas/:id", handlers.UpdatePost)
		api.DELETE("/ideas/:id", handlers.DeletePost)

		// roulette routes
		api.GET("/roulette", handlers.GetIdeaRoulette)
		api.POST("/roulette", handlers.AddIdeaRoulette)
		api.PUT("/roulette/:id", handlers.EditIdeaRoulette)
		api.DELETE("/roulette/:id", handlers.DeleteIdeaRoulette)

		// period tracking routes
		api.GET("/periods/days", handlers.GetPeriodDays)
		api.GET("/periods/partner/days", handlers.GetPartnerPeriodDays)
		api.POST("/periods/days", handlers.CreatePeriodDay)
		api.DELETE("/periods/days/:date", handlers.DeletePeriodDay)

		api.GET("/periods/settings", handlers.GetCycleSettings)
		api.PUT("/periods/settings", handlers.UpdateCycleSettings)

		// user routes
		api.GET("/user/metadata", handlers.GetUserMetadata)
		api.PUT("/user/metadata", handlers.UpdateUserMetadata)
		api.GET("/user/partner/metadata", handlers.GetPartnerMetadata)
		api.DELETE("/user", handlers.DeleteUser)

		// checkin routes
		api.POST("/checkin", handlers.CreateCheckin)
		api.GET("/checkin/:date", handlers.GetTodayCheckin)
		api.DELETE("/checkin/:date", handlers.DeleteCheckin)
		api.GET("/checkin/partner/:date", handlers.GetPartnerCheckin)

		// debug route
		api.GET("/debug/connection", handlers.DebugConnection)

		// feedback routes
		api.POST("/feedback", handlers.SubmitFeedback)
		api.GET("/feedback", handlers.GetUserFeedback)

		// map pin routes
		pins := api.Group("/pins")
		{
			pins.GET("", handlers.GetPins)
			pins.POST("", handlers.CreatePin)
			pins.PUT("/:id", handlers.UpdatePin)
			pins.DELETE("/:id", handlers.DeletePin)
		}
	}

	// run server
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}
	router.Run(":" + port)
}
