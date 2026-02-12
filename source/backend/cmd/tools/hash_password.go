package main

import (
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Uso: go run cmd/tools/hash_password.go <password>")
		fmt.Println("Ejemplo: go run cmd/tools/hash_password.go admin123")
		os.Exit(1)
	}

	password := os.Args[1]
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generando hash: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Password: %s\n", password)
	fmt.Printf("Hash: %s\n", string(hash))
}
