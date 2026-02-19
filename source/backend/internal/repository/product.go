package repository

import (
	"database/sql"

	"boxmagic/internal/models"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) ListProducts(activeOnly bool) ([]*models.Product, error) {
	q := `SELECT id, name, COALESCE(description,''), COALESCE(category,'other'), price, stock, COALESCE(image_url,''), active, created_at FROM products WHERE 1=1`
	if activeOnly {
		q += ` AND active = true`
	}
	q += ` ORDER BY name ASC`
	rows, err := r.db.Query(q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Product
	for rows.Next() {
		p := &models.Product{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Category, &p.Price, &p.Stock, &p.ImageURL, &p.Active, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *ProductRepository) CreateProduct(p *models.Product) error {
	return r.db.QueryRow(
		`INSERT INTO products (name, description, category, price, stock, image_url, active) VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id, created_at`,
		p.Name, p.Description, p.Category, p.Price, p.Stock, p.ImageURL,
	).Scan(&p.ID, &p.CreatedAt)
}

func (r *ProductRepository) UpdateProduct(p *models.Product) error {
	_, err := r.db.Exec(
		`UPDATE products SET name=$1, description=$2, category=$3, price=$4, stock=$5, image_url=$6, active=$7 WHERE id=$8`,
		p.Name, p.Description, p.Category, p.Price, p.Stock, p.ImageURL, p.Active, p.ID,
	)
	return err
}

func (r *ProductRepository) DeleteProduct(id int64) error {
	_, err := r.db.Exec(`DELETE FROM products WHERE id=$1`, id)
	return err
}

func (r *ProductRepository) CreateSale(sale *models.Sale) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = tx.QueryRow(
		`INSERT INTO sales (user_id, total, payment_method, notes, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
		sale.UserID, sale.Total, sale.PaymentMethod, sale.Notes, sale.CreatedBy,
	).Scan(&sale.ID, &sale.CreatedAt)
	if err != nil {
		return err
	}

	for i := range sale.Items {
		item := &sale.Items[i]
		err = tx.QueryRow(
			`INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
			sale.ID, item.ProductID, item.ProductName, item.Quantity, item.UnitPrice,
		).Scan(&item.ID)
		if err != nil {
			return err
		}
		item.SaleID = sale.ID
		// Update stock if product has limited stock
		if item.ProductID != nil {
			_, err = tx.Exec(`UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock > 0`, item.Quantity, *item.ProductID)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *ProductRepository) ListSales(limit, offset int) ([]*models.Sale, error) {
	rows, err := r.db.Query(`SELECT s.id, s.user_id, s.total, COALESCE(s.payment_method,'cash'), COALESCE(s.notes,''), s.created_by, s.created_at, COALESCE(u.name,'')
		FROM sales s LEFT JOIN users u ON u.id = s.user_id ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []*models.Sale
	for rows.Next() {
		s := &models.Sale{}
		if err := rows.Scan(&s.ID, &s.UserID, &s.Total, &s.PaymentMethod, &s.Notes, &s.CreatedBy, &s.CreatedAt, &s.UserName); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *ProductRepository) GetSaleItems(saleID int64) ([]models.SaleItem, error) {
	rows, err := r.db.Query(`SELECT id, sale_id, product_id, product_name, quantity, unit_price FROM sale_items WHERE sale_id = $1`, saleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []models.SaleItem
	for rows.Next() {
		it := models.SaleItem{}
		if err := rows.Scan(&it.ID, &it.SaleID, &it.ProductID, &it.ProductName, &it.Quantity, &it.UnitPrice); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, nil
}
