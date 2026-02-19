package models

import "time"

const (
	DiscountTypePercent = "percent" // discount_value = 0-100
	DiscountTypeAmount  = "amount"  // discount_value en CLP
)

type DiscountCode struct {
	ID            int64      `json:"id"`
	Code          string     `json:"code"`
	Description   string     `json:"description,omitempty"`
	DiscountType  string     `json:"discount_type"`
	DiscountValue int64      `json:"discount_value"`
	MaxUses       int        `json:"max_uses"`
	UsesCount     int        `json:"uses_count"`
	ValidUntil    *time.Time `json:"valid_until,omitempty"`
	Active        bool       `json:"active"`
	CreatedAt     time.Time  `json:"created_at"`
}

type CreateDiscountCodeRequest struct {
	Code          string  `json:"code"`
	Description   string  `json:"description"`
	DiscountType  string  `json:"discount_type"`
	DiscountValue int64   `json:"discount_value"`
	MaxUses       int     `json:"max_uses"`
	ValidUntil    *string `json:"valid_until"` // "YYYY-MM-DD" or null
}

type ValidateDiscountResponse struct {
	Code          string `json:"code"`
	DiscountType  string `json:"discount_type"`
	DiscountValue int64  `json:"discount_value"`
	Description   string `json:"description,omitempty"`
}

// ApplyDiscount returns the final price after applying a discount code.
func (d *DiscountCode) ApplyDiscount(originalPrice int64) int64 {
	if d == nil {
		return originalPrice
	}
	switch d.DiscountType {
	case DiscountTypePercent:
		discount := originalPrice * d.DiscountValue / 100
		result := originalPrice - discount
		if result < 0 {
			return 0
		}
		return result
	case DiscountTypeAmount:
		result := originalPrice - d.DiscountValue
		if result < 0 {
			return 0
		}
		return result
	}
	return originalPrice
}
