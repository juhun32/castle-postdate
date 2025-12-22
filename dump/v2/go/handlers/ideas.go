package handlers

import (
	"context"
	"net/http"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type Idea struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Author      string    `json:"author"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
	Likes       int       `json:"likes"`
	Tags        []string  `json:"tags"`
	Comments    []Comment `json:"comments"`
}

type Comment struct {
	ID        string `json:"id"`
	Author    string `json:"author"`
	CreatedAt string `json:"created_at"`
	Content   string `json:"content"`
}

// getAllpost; returns all posts from the database
// IMPORTANT: auth shouldn't be required for this endpoint
// so that users can see posts without logging in

func GetAllPosts(c *gin.Context) {
	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	q1, err := fsClient.Collection("ideas").Documents(context.Background()).GetAll()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	ideas := []Idea{}
	for _, doc := range q1 {
		var idea Idea
		if err := doc.DataTo(&idea); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse post data"})
			return
		}
		idea.ID = doc.Ref.ID
		ideas = append(ideas, idea)
	}

	c.JSON(http.StatusOK, ideas)
}

// getPost; get posts that user has created
// IMPORTANT: this requires user to be authenticated unlike getAllPosts
func GetPost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// get firestore client from context
	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get user posts from firestore
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	postsRef := userDocRef.Collection("posts")
	q, err := postsRef.Documents(context.Background()).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}

	posts := []Idea{}
	for _, doc := range q {
		var post Idea
		if err := doc.DataTo(&post); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse post data"})
			return
		}
		post.ID = doc.Ref.ID
		posts = append(posts, post)
	}

	c.JSON(http.StatusOK, posts)
}

// addpost; adds a new post to the database
// IMPORTANT: this requires user to be authenticated like getPost
func AddPost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get user email from session
	userDoc, err := fsClient.Collection("users").Doc(uid.(string)).Get(context.Background())
	if err != nil || !userDoc.Exists() {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}
	userName := userDoc.Data()["name"].(string)

	var newPost Idea
	if err := c.ShouldBindJSON(&newPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post data"})
		return
	}

	newPost.Author = userName
	newPost.CreatedAt = newPost.UpdatedAt
	newPost.Likes = 0
	newPost.Tags = []string{}
	newPost.Comments = []Comment{}

	// post title is required
	if newPost.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title and description are required"})
		return
	}

	// add post to firestore
	postDocRef, _, err := fsClient.Collection("ideas").Add(context.Background(), newPost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add post"})
		return
	}
	newPost.ID = postDocRef.ID

	// add post to user's posts collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	_, err = userDocRef.Collection("posts").Doc(postDocRef.ID).Set(context.Background(), newPost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add post to user"})
		return
	}

	c.JSON(http.StatusCreated, newPost)
}

// deletePost; deletes a post from the database
func DeletePost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// delete post from firestore
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	if _, err := postDocRef.Delete(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
		return
	}

	// also delete from user's posts collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	if _, err := userDocRef.Collection("posts").Doc(postID).Delete(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post from user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// UpdatePost; updates an existing post
func UpdatePost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	var updatedPost Idea
	if err := c.ShouldBindJSON(&updatedPost); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post data"})
		return
	}

	// update post in firestore
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	if _, err := postDocRef.Set(context.Background(), updatedPost, firestore.MergeAll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully"})
}

// AddComment; adds a comment to a post
func AddComment(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	var newComment Comment
	if err := c.ShouldBindJSON(&newComment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment data"})
		return
	}

	newComment.Author = uid.(string)
	newComment.CreatedAt = time.Now().Format(time.RFC3339)

	if newComment.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comment content is required"})
		return
	}

	// add comment to post's comments collection
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	commentDocRef, _, err := postDocRef.Collection("comments").Add(context.Background(), newComment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}
	newComment.ID = commentDocRef.ID

	// also add comment to user's comments collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	_, err = userDocRef.Collection("comments").Doc(commentDocRef.ID).Set(context.Background(), newComment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment to user"})
		return
	}

	// update post's comments count
	_, err = postDocRef.Update(context.Background(), []firestore.Update{
		{Path: "comments_count",

			Value: firestore.Increment(1)},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comments count"})
		return
	}

	// increment comments count in user's posts collection
	_, err = userDocRef.Collection("posts").Doc(postID).Update(context.Background(), []firestore.Update{
		{Path: "comments_count", Value: firestore.Increment(1)},
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comments count in user's posts"})
		return
	}

	// increment comments count in post's comments collection
	_, err = postDocRef.Update(context.Background(), []firestore.Update{
		{Path: "comments_count", Value: firestore.Increment(1)},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comments count in post's comments"})
		return
	}

	c.JSON(http.StatusCreated, newComment)
}

// DeleteComment; deletes a comment from a post
func DeleteComment(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("post_id")
	commentID := c.Param("comment_id")
	if postID == "" || commentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID and Comment ID are required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// delete comment from post's comments collection
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	commentDocRef := postDocRef.Collection("comments").Doc(commentID)
	if _, err := commentDocRef.Delete(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment"})
		return
	}

	// also delete from user's comments collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	if _, err := userDocRef.Collection("comments").Doc(commentID).Delete(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete comment from user"})
		return
	}

	// decrement comments count in post's comments collection
	if _, err := postDocRef.Update(context.Background(), []firestore.Update{
		{Path: "comments_count", Value: firestore.Increment(-1)},
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comments count"})
		return
	}

	// decrement comments count in user's posts collection
	if _, err := userDocRef.Collection("posts").Doc(postID).Update(context.Background(), []firestore.Update{
		{Path: "comments_count", Value: firestore.Increment(-1)},
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comments count in user's posts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment deleted successfully"})
}

// UpdateComment; updates an existing comment
func UpdateComment(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("post_id")
	commentID := c.Param("comment_id")
	if postID == "" || commentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID and Comment ID are required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	var updatedComment Comment
	if err := c.ShouldBindJSON(&updatedComment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid comment data"})
		return
	}

	// update comment in post's comments collection
	commentDocRef := fsClient.Collection("ideas").Doc(postID).Collection("comments").Doc(commentID)
	if _, err := commentDocRef.Set(context.Background(), updatedComment, firestore.MergeAll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Comment updated successfully"})
}

// LikePost; increments the likes count for a post
func LikePost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// increment likes count in post document
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	if _, err := postDocRef.Update(context.Background(), []firestore.Update{
		{Path: "likes", Value: firestore.Increment(1)},
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to like post"})
		return
	}
	// also increment likes count in user's posts collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	if _, err := userDocRef.Collection("posts").Doc(postID).Update(context.Background(), []firestore.Update{
		{Path: "likes", Value: firestore.Increment(1)},
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update likes count in user's posts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Post liked successfully"})
}

// UnlikePost; decrements the likes count for a post
func UnlikePost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// decrement likes count in post document
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	if _, err := postDocRef.Update(context.Background(), []firestore.Update{
		{Path: "likes", Value: firestore.Increment(-1)},
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlike post"})
		return
	}
	// also decrement likes count in user's posts collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	if _, err := userDocRef.Collection("posts").Doc(postID).Update(context.Background(), []firestore.Update{
		{Path: "likes", Value: firestore.Increment(-1)},
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update likes count in user's posts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Post unliked successfully"})
}

// GetPostComments; retrieves all comments for a post
func GetPostComments(c *gin.Context) {
	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get comments from post's comments collection
	postDocRef := fsClient.Collection("ideas").Doc(postID)
	q, err := postDocRef.Collection("comments").Documents(context.Background()).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	comments := []Comment{}
	for _, doc := range q {
		var comment Comment
		if err := doc.DataTo(&comment); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse comment data"})
			return
		}
		comment.ID = doc.Ref.ID
		comments = append(comments, comment)
	}

	c.JSON(http.StatusOK, comments)
}

// bookmarkPost; adds a post to user's bookmarks
func BookmarkPost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// add post to user's bookmarks collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	_, err := userDocRef.Collection("bookmarks").Doc(postID).Set(context.Background(), map[string]interface{}{
		"post_id": postID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to bookmark post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post bookmarked successfully"})
}

// unbookmarkPost; removes a post from user's bookmarks
func UnbookmarkPost(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	postID := c.Param("id")
	if postID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Post ID is required"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// remove post from user's bookmarks collection
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	if _, err := userDocRef.Collection("bookmarks").Doc(postID).Delete(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unbookmark post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post unbookmarked successfully"})
}

// GetBookmarks; retrieves all bookmarked posts for a user
func GetBookmarks(c *gin.Context) {
	session := sessions.Default(c)
	uid := session.Get("user_id")
	if uid == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	fsClient := c.MustGet("firestore").(*firestore.Client)

	// get user's bookmarks from firestore
	userDocRef := fsClient.Collection("users").Doc(uid.(string))
	q, err := userDocRef.Collection("bookmarks").Documents(context.Background()).GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bookmarks"})
		return
	}

	bookmarks := []string{}
	for _, doc := range q {
		bookmarks = append(bookmarks, doc.Ref.ID)
	}

	c.JSON(http.StatusOK, bookmarks)
}
