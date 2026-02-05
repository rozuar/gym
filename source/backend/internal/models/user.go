package models

import (
	"time"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Phone        string    `json:"phone,omitempty"`
	Role         Role      `json:"role"`
	Active       bool      `json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Phone    string `json:"phone,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UpdateUserRequest struct {
	Name   string `json:"name,omitempty"`
	Phone  string `json:"phone,omitempty"`
	Active *bool  `json:"active,omitempty"`
	Role   Role   `json:"role,omitempty"`
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}
