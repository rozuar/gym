package models

import "time"

type NutritionLog struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	FoodName  string    `json:"food_name"`
	Grams     *float64  `json:"grams"`
	Calories  *float64  `json:"calories"`
	ProteinG  *float64  `json:"protein_g"`
	CarbsG    *float64  `json:"carbs_g"`
	FatG      *float64  `json:"fat_g"`
	MealType  string    `json:"meal_type"`
	LoggedAt  string    `json:"logged_at"`
	CreatedAt time.Time `json:"created_at"`
}

type WaterLog struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	ML        int       `json:"ml"`
	LoggedAt  string    `json:"logged_at"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateNutritionLogRequest struct {
	FoodName string   `json:"food_name"`
	Grams    *float64 `json:"grams"`
	Calories *float64 `json:"calories"`
	ProteinG *float64 `json:"protein_g"`
	CarbsG   *float64 `json:"carbs_g"`
	FatG     *float64 `json:"fat_g"`
	MealType string   `json:"meal_type"`
	LoggedAt string   `json:"logged_at"`
}

type NutritionSummary struct {
	Date      string  `json:"date"`
	Calories  float64 `json:"calories"`
	ProteinG  float64 `json:"protein_g"`
	CarbsG    float64 `json:"carbs_g"`
	FatG      float64 `json:"fat_g"`
	WaterML   int     `json:"water_ml"`
}
