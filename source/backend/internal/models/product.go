package models

import "time"

type Product struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Price       int64     `json:"price"`
	Stock       int       `json:"stock"` // -1 = unlimited
	ImageURL    string    `json:"image_url"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
}

type SaleItem struct {
	ID          int64  `json:"id"`
	SaleID      int64  `json:"sale_id"`
	ProductID   *int64 `json:"product_id"`
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
	UnitPrice   int64  `json:"unit_price"`
}

type Sale struct {
	ID            int64      `json:"id"`
	UserID        *int64     `json:"user_id"`
	Total         int64      `json:"total"`
	PaymentMethod string     `json:"payment_method"`
	Notes         string     `json:"notes"`
	CreatedBy     int64      `json:"created_by"`
	CreatedAt     time.Time  `json:"created_at"`
	Items         []SaleItem `json:"items"`
	UserName      string     `json:"user_name"`
}

type CreateSaleRequest struct {
	UserID        *int64     `json:"user_id"`
	PaymentMethod string     `json:"payment_method"`
	Notes         string     `json:"notes"`
	Items         []SaleItem `json:"items"`
}
