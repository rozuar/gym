package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type NutritionRepository struct {
	db *sql.DB
}

func NewNutritionRepository(db *sql.DB) *NutritionRepository {
	return &NutritionRepository{db: db}
}

func (r *NutritionRepository) LogFood(l *models.NutritionLog) error {
	return r.db.QueryRow(
		`INSERT INTO nutrition_logs (user_id, food_name, grams, calories, protein_g, carbs_g, fat_g, meal_type, logged_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at`,
		l.UserID, l.FoodName, l.Grams, l.Calories, l.ProteinG, l.CarbsG, l.FatG, l.MealType, l.LoggedAt,
	).Scan(&l.ID, &l.CreatedAt)
}

func (r *NutritionRepository) ListByDate(userID int64, date string) ([]*models.NutritionLog, error) {
	rows, err := r.db.Query(`SELECT id, user_id, food_name, grams, calories, protein_g, carbs_g, fat_g, COALESCE(meal_type,'other'), logged_at::text, created_at
		FROM nutrition_logs WHERE user_id=$1 AND logged_at=$2 ORDER BY created_at ASC`, userID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.NutritionLog
	for rows.Next() {
		l := &models.NutritionLog{}
		if err := rows.Scan(&l.ID, &l.UserID, &l.FoodName, &l.Grams, &l.Calories, &l.ProteinG, &l.CarbsG, &l.FatG, &l.MealType, &l.LoggedAt, &l.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, l)
	}
	return list, nil
}

func (r *NutritionRepository) DeleteLog(id int64, userID int64) error {
	_, err := r.db.Exec(`DELETE FROM nutrition_logs WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

func (r *NutritionRepository) GetSummary(userID int64, date string) (*models.NutritionSummary, error) {
	s := &models.NutritionSummary{Date: date}
	err := r.db.QueryRow(`SELECT COALESCE(SUM(calories),0), COALESCE(SUM(protein_g),0), COALESCE(SUM(carbs_g),0), COALESCE(SUM(fat_g),0)
		FROM nutrition_logs WHERE user_id=$1 AND logged_at=$2`, userID, date).
		Scan(&s.Calories, &s.ProteinG, &s.CarbsG, &s.FatG)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	// water
	err = r.db.QueryRow(`SELECT COALESCE(SUM(ml),0) FROM water_logs WHERE user_id=$1 AND logged_at=$2`, userID, date).Scan(&s.WaterML)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	return s, nil
}

func (r *NutritionRepository) LogWater(userID int64, ml int, date string) error {
	_, err := r.db.Exec(`INSERT INTO water_logs (user_id, ml, logged_at) VALUES ($1,$2,$3)`, userID, ml, date)
	return err
}

func (r *NutritionRepository) DeleteWaterLog(id int64, userID int64) error {
	_, err := r.db.Exec(`DELETE FROM water_logs WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

func (r *NutritionRepository) ListWaterByDate(userID int64, date string) ([]*models.WaterLog, error) {
	rows, err := r.db.Query(`SELECT id, user_id, ml, logged_at::text, created_at FROM water_logs WHERE user_id=$1 AND logged_at=$2 ORDER BY created_at ASC`, userID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.WaterLog
	for rows.Next() {
		w := &models.WaterLog{}
		if err := rows.Scan(&w.ID, &w.UserID, &w.ML, &w.LoggedAt, &w.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, w)
	}
	return list, nil
}
