package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type InstructorHandler struct {
	instructorRepo *repository.InstructorRepository
}

func NewInstructorHandler(db *sql.DB) *InstructorHandler {
	return &InstructorHandler{
		instructorRepo: repository.NewInstructorRepository(db),
	}
}

func (h *InstructorHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInstructorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	instructor := &models.Instructor{
		Name:      req.Name,
		Email:     req.Email,
		Phone:     req.Phone,
		Specialty: req.Specialty,
		Bio:       req.Bio,
		Active:    true,
	}

	if err := h.instructorRepo.Create(instructor); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create instructor")
		return
	}

	respondJSON(w, http.StatusCreated, instructor)
}

func (h *InstructorHandler) List(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active") != "false"

	instructors, err := h.instructorRepo.List(activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch instructors")
		return
	}
	if instructors == nil {
		instructors = []*models.Instructor{}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"instructors": instructors})
}

func (h *InstructorHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid instructor ID")
		return
	}

	instructor, err := h.instructorRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Instructor not found")
		return
	}

	respondJSON(w, http.StatusOK, instructor)
}

func (h *InstructorHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid instructor ID")
		return
	}

	instructor, err := h.instructorRepo.GetByID(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Instructor not found")
		return
	}

	var req models.UpdateInstructorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name != "" {
		instructor.Name = req.Name
	}
	if req.Email != "" {
		instructor.Email = req.Email
	}
	if req.Phone != "" {
		instructor.Phone = req.Phone
	}
	if req.Specialty != "" {
		instructor.Specialty = req.Specialty
	}
	if req.Bio != "" {
		instructor.Bio = req.Bio
	}
	if req.Active != nil {
		instructor.Active = *req.Active
	}

	if err := h.instructorRepo.Update(instructor); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update instructor")
		return
	}

	respondJSON(w, http.StatusOK, instructor)
}

func (h *InstructorHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid instructor ID")
		return
	}

	if err := h.instructorRepo.Delete(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete instructor")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
