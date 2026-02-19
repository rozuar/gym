package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type CommentHandler struct {
	repo *repository.CommentRepository
}

func NewCommentHandler(repo *repository.CommentRepository) *CommentHandler {
	return &CommentHandler{repo: repo}
}

func (h *CommentHandler) List(w http.ResponseWriter, r *http.Request) {
	resultID, err := strconv.ParseInt(r.PathValue("resultId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid result ID")
		return
	}

	comments, err := h.repo.ListByResult(resultID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}
	if comments == nil {
		comments = []*models.ResultComment{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"comments": comments})
}

func (h *CommentHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	resultID, err := strconv.ParseInt(r.PathValue("resultId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid result ID")
		return
	}

	var req models.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Content == "" {
		respondError(w, http.StatusBadRequest, "Content is required")
		return
	}

	c := &models.ResultComment{
		ResultID: resultID,
		UserID:   userID,
		Content:  req.Content,
	}
	if err := h.repo.Create(c); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create comment")
		return
	}
	respondJSON(w, http.StatusCreated, c)
}

func (h *CommentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	commentID, err := strconv.ParseInt(r.PathValue("commentId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid comment ID")
		return
	}

	existing, err := h.repo.GetByID(commentID)
	if err != nil || existing == nil {
		respondError(w, http.StatusNotFound, "Comment not found")
		return
	}
	if existing.UserID != userID {
		respondError(w, http.StatusForbidden, "Cannot delete another user's comment")
		return
	}

	if err := h.repo.Delete(commentID, userID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete comment")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
