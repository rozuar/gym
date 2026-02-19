package models

type Tag struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UserWithTags struct {
	UserID int64   `json:"user_id"`
	Tags   []Tag   `json:"tags"`
}
