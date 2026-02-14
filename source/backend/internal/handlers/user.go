package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type UserHandler struct {
	userRepo repository.UserRepo
}

func NewUserHandler(userRepo repository.UserRepo) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
	}
}

func (h *UserHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.userRepo.GetByID(userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != nil {
		user.Phone = *req.Phone
	}
	if req.AvatarURL != nil {
		user.AvatarURL = *req.AvatarURL
	}

	if err := h.userRepo.Update(user); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := 50
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	users, err := h.userRepo.List(limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"users":  users,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := h.userRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	user, err := h.userRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != nil {
		user.Phone = *req.Phone
	}
	if req.AvatarURL != nil {
		user.AvatarURL = *req.AvatarURL
	}
	if req.Active != nil {
		user.Active = *req.Active
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.InvitationClasses != nil {
		user.InvitationClasses = *req.InvitationClasses
	}

	if err := h.userRepo.Update(user); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update user")
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) AddInvitation(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req models.AddInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Count <= 0 {
		req.Count = 1
	}

	if _, err := h.userRepo.GetByID(id); err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	if err := h.userRepo.AddInvitationClasses(id, req.Count); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to add invitation")
		return
	}

	user, _ := h.userRepo.GetByID(id)
	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	if err := h.userRepo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
