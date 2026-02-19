package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"boxmagic/internal/middleware"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

type ProductHandler struct {
	repo *repository.ProductRepository
}

func NewProductHandler(repo *repository.ProductRepository) *ProductHandler {
	return &ProductHandler{repo: repo}
}

func (h *ProductHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	activeOnly := r.URL.Query().Get("active") != "false"
	products, err := h.repo.ListProducts(activeOnly)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}
	if products == nil {
		products = []*models.Product{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"products": products})
}

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Price       int64  `json:"price"`
		Stock       int    `json:"stock"`
		ImageURL    string `json:"image_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Category == "" {
		req.Category = "other"
	}
	if req.Stock == 0 {
		req.Stock = -1 // unlimited by default
	}
	p := &models.Product{
		Name: req.Name, Description: req.Description,
		Category: req.Category, Price: req.Price,
		Stock: req.Stock, ImageURL: req.ImageURL,
	}
	if err := h.repo.CreateProduct(p); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create product")
		return
	}
	respondJSON(w, http.StatusCreated, p)
}

func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	products, _ := h.repo.ListProducts(false)
	var p *models.Product
	for _, prod := range products {
		if prod.ID == id {
			p = prod
			break
		}
	}
	if p == nil {
		respondError(w, http.StatusNotFound, "Product not found")
		return
	}
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Category    string `json:"category"`
		Price       *int64 `json:"price"`
		Stock       *int   `json:"stock"`
		ImageURL    string `json:"image_url"`
		Active      *bool  `json:"active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name != "" { p.Name = req.Name }
	if req.Description != "" { p.Description = req.Description }
	if req.Category != "" { p.Category = req.Category }
	if req.Price != nil { p.Price = *req.Price }
	if req.Stock != nil { p.Stock = *req.Stock }
	if req.ImageURL != "" { p.ImageURL = req.ImageURL }
	if req.Active != nil { p.Active = *req.Active }
	if err := h.repo.UpdateProduct(p); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update product")
		return
	}
	respondJSON(w, http.StatusOK, p)
}

func (h *ProductHandler) DeleteProduct(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid ID")
		return
	}
	if err := h.repo.DeleteProduct(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete product")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProductHandler) CreateSale(w http.ResponseWriter, r *http.Request) {
	createdBy := middleware.GetUserID(r.Context())
	var req models.CreateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if len(req.Items) == 0 {
		respondError(w, http.StatusBadRequest, "At least one item required")
		return
	}
	// Calculate total
	var total int64
	for _, it := range req.Items {
		total += it.UnitPrice * int64(it.Quantity)
	}
	if req.PaymentMethod == "" {
		req.PaymentMethod = "cash"
	}
	sale := &models.Sale{
		UserID: req.UserID, Total: total,
		PaymentMethod: req.PaymentMethod, Notes: req.Notes,
		CreatedBy: createdBy, Items: req.Items,
	}
	if err := h.repo.CreateSale(sale); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create sale")
		return
	}
	respondJSON(w, http.StatusCreated, sale)
}

func (h *ProductHandler) ListSales(w http.ResponseWriter, r *http.Request) {
	limit := 50
	offset := 0
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil { limit = v }
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil { offset = v }
	}
	sales, err := h.repo.ListSales(limit, offset)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch sales")
		return
	}
	if sales == nil {
		sales = []*models.Sale{}
	}
	// Attach items
	for _, s := range sales {
		items, _ := h.repo.GetSaleItems(s.ID)
		if items != nil {
			s.Items = items
		}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"sales": sales})
}
