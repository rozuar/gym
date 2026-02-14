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
	ID                int64      `json:"id"`
	Email             string     `json:"email"`
	PasswordHash      string     `json:"-"`
	Name              string     `json:"name"`
	Phone             string     `json:"phone,omitempty"`
	AvatarURL         string     `json:"avatar_url,omitempty"`  // Foto de perfil
	Role              Role       `json:"role"`
	Active            bool       `json:"active"`
	InvitationClasses int        `json:"invitation_classes"`    // Clases invitación disponibles
	BirthDate         *time.Time `json:"birth_date,omitempty"`
	Sex               string     `json:"sex,omitempty"`         // "M" o "F"
	WeightKg          float64    `json:"weight_kg,omitempty"`
	HeightCm          float64    `json:"height_cm,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
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
	Name              string  `json:"name,omitempty"`
	Phone             *string `json:"phone,omitempty"`    // nil=no change, ptr to ""=clear
	AvatarURL         *string `json:"avatar_url,omitempty"` // nil=no change, ptr to ""=clear
	Active            *bool   `json:"active,omitempty"`
	Role              Role    `json:"role,omitempty"`
	InvitationClasses *int    `json:"invitation_classes,omitempty"`
}

type AddInvitationRequest struct {
	Count int `json:"count"` // Clases invitación a agregar (típicamente 1)
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}
