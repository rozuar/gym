package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type TagHandler struct {
	repo *repository.TagRepository
}

func NewTagHandler(repo *repository.TagRepository) *TagHandler {
	return &TagHandler{repo: repo}
}

func (h *TagHandler) ListTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.repo.ListTags()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch tags")
		return
	}
	if tags == nil {
		tags = []*models.Tag{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"tags": tags})
}

func (h *TagHandler) CreateTag(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Color == "" {
		req.Color = "#3b82f6"
	}
	t := &models.Tag{Name: req.Name, Color: req.Color}
	if err := h.repo.CreateTag(t); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create tag")
		return
	}
	respondJSON(w, http.StatusCreated, t)
}

func (h *TagHandler) UpdateTag(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	t, err := h.repo.GetByID(id)
	if err != nil || t == nil {
		respondError(w, http.StatusNotFound, "Tag not found")
		return
	}
	var req struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name != "" { t.Name = req.Name }
	if req.Color != "" { t.Color = req.Color }
	if err := h.repo.UpdateTag(t); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update tag")
		return
	}
	respondJSON(w, http.StatusOK, t)
}

func (h *TagHandler) DeleteTag(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.DeleteTag(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete tag")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TagHandler) GetUserTags(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(r.PathValue("userId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}
	tags, err := h.repo.GetUserTags(userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch tags")
		return
	}
	if tags == nil {
		tags = []*models.Tag{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"tags": tags})
}

func (h *TagHandler) AddUserTag(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(r.PathValue("userId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}
	var req struct {
		TagID int64 `json:"tag_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.TagID == 0 {
		respondError(w, http.StatusBadRequest, "tag_id required")
		return
	}
	if err := h.repo.AddUserTag(userID, req.TagID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add tag")
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"added": true})
}

func (h *TagHandler) RemoveUserTag(w http.ResponseWriter, r *http.Request) {
	userID, err := strconv.ParseInt(r.PathValue("userId"), 10, 64)
	tagID, err2 := strconv.ParseInt(r.PathValue("tagId"), 10, 64)
	if err != nil || err2 != nil {
		respondError(w, http.StatusBadRequest, "Invalid IDs")
		return
	}
	if err := h.repo.RemoveUserTag(userID, tagID); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to remove tag")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
