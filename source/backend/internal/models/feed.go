package models

import "time"

type FeedEvent struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	EventType string    `json:"event_type"` // result, pr, booking
	RefID     *int64    `json:"ref_id,omitempty"`
	DataJSON  string    `json:"data_json,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type FeedEventWithUser struct {
	FeedEvent
	UserName  string `json:"user_name"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

type Fistbump struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	ResultID  int64     `json:"result_id"`
	CreatedAt time.Time `json:"created_at"`
}
