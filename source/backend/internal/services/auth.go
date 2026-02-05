package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"boxmagic/internal/config"
	"boxmagic/internal/models"
	"boxmagic/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists         = errors.New("user already exists")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthService struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.AuthResponse, error) {
	existing, _ := s.userRepo.GetByEmail(req.Email)
	if existing != nil {
		return nil, ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
		Phone:        req.Phone,
		Role:         models.RoleUser,
		Active:       true,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return s.generateTokens(user)
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !user.Active {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.generateTokens(user)
}

func (s *AuthService) Refresh(refreshToken string) (*models.AuthResponse, error) {
	userID, err := s.userRepo.GetRefreshToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, ErrInvalidToken
	}

	s.userRepo.DeleteRefreshToken(refreshToken)

	return s.generateTokens(user)
}

func (s *AuthService) generateTokens(user *models.User) (*models.AuthResponse, error) {
	claims := jwt.MapClaims{
		"sub":  user.ID,
		"email": user.Email,
		"role": user.Role,
		"exp":  time.Now().Add(s.cfg.JWTExpiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return nil, err
	}

	refreshToken := generateRandomToken()
	expiresAt := time.Now().Add(s.cfg.RefreshTokenExpiry)

	if err := s.userRepo.SaveRefreshToken(user.ID, refreshToken, expiresAt); err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func generateRandomToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
