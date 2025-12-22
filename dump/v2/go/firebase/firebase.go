package firebase

import (
	"context"
	"fmt"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
)

// initialize firebase/firestore client
func InitFirebase(ctx context.Context) (*firestore.Client, error) {
	var opt option.ClientOption
	credFile := "firebase_credentials.json"

	if content := os.Getenv("FIREBASE_CREDENTIALS_JSON"); content != "" {
		fmt.Printf("DEBUG: Initializing Firebase with credentials from environment variable\n")
		opt = option.WithCredentialsJSON([]byte(content))
	} else {
		fmt.Printf("DEBUG: No FIREBASE_CREDENTIALS_JSON environment variable found, using local file\n")
		// Check if credentials file exists
		if _, err := os.Stat(credFile); os.IsNotExist(err) {
			fmt.Printf("ERROR: Firebase credentials file does not exist: %s\n", credFile)
			return nil, fmt.Errorf("firebase credentials file not found: %s", credFile)
		}
		opt = option.WithCredentialsFile(credFile)
	}

	fmt.Printf("DEBUG: Creating Firebase app\n")
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		fmt.Printf("ERROR: Failed to create Firebase app: %v\n", err)
		return nil, err
	}

	fmt.Printf("DEBUG: Creating Firestore client\n")
	client, err := app.Firestore(ctx)
	if err != nil {
		fmt.Printf("ERROR: Failed to create Firestore client: %v\n", err)
		return nil, err
	}

	fmt.Printf("DEBUG: Firebase/Firestore initialized successfully\n")
	return client, nil
}
