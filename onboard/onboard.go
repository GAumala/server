package onboard

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"

	// vendor packages
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	// custom packages

	cError "source.joyread.app/scm/joyr/server/error"
	"source.joyread.app/scm/joyr/server/models"
)

func _HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func _CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func _GenerateJWTToken(passwordHash string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{})
	tokenString, err := token.SignedString([]byte(passwordHash))
	return tokenString, err
}

func _ValidateJWTToken(tokenString string, passwordHash string) (bool, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(passwordHash), nil
	})

	return token.Valid, err
}

// SignUpStruct struct
type SignUpStruct struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// PostSignUp ...
func PostSignUp(c *gin.Context) {
	var form SignUpStruct

	if err := c.BindJSON(&form); err == nil {
		// Generate password hash using bcrypt
		passwordHash, err := _HashPassword(form.Password)
		cError.CheckError(err)

		// Generate JWT token using the hash password above
		tokenString, err := _GenerateJWTToken(passwordHash)
		cError.CheckError(err)

		db := c.MustGet("db").(*sql.DB)

		models.InsertUser(db, form.Username, form.Email, passwordHash, tokenString)

		// Convert string to int64
		// smtpPort, _ := strconv.Atoi(form.SMTPPort)

		// models.InsertSMTP(db, form.SMTPServer, smtpPort, form.SMTPEmail, form.SMTPPassword)

		// Send confirmation email
		// emailSubject := "Email confirmation - Joyread"
		// emailBody := "Hi,<br /><br />Please confirm this link."
		// go email.SendEmail(form.SMTPEmail, form.Email, emailSubject, emailBody, form.SMTPServer, smtpPort, form.SMTPEmail, form.SMTPPassword)

		c.JSON(http.StatusMovedPermanently, gin.H{
			"status": "registered",
			"token":  tokenString,
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
}

// SMTP struct
type SMTPStruct struct {
	SMTPHostname string `json:"smtpHostname" binding:"required"`
	SMTPPort     string `json:"smtpPort" binding:"required"`
	SMTPUsername string `json:"smtpUsername" binding:"required"`
	SMTPPassword string `json:"smtpPassword" binding:"required"`
}

// PostSMTP ...
func PostSMTP(c *gin.Context) {
	var form SMTPStruct

	if err := c.BindJSON(&form); err == nil {
		db := c.MustGet("db").(*sql.DB)

		smtpPort, _ := strconv.Atoi(form.SMTPPort)
		models.InsertSMTP(db, form.SMTPHostname, smtpPort, form.SMTPUsername, form.SMTPPassword)

		c.JSON(http.StatusMovedPermanently, gin.H{
			"status": "registered",
		})
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
}

// SignInStruct struct
type SignInStruct struct {
	UsernameOrEmail string `json:"usernameoremail" binding:"required"`
	Password        string `json:"password" binding:"required"`
}

// PostSignIn ...
func PostSignIn(c *gin.Context) {
	var form SignInStruct

	if err := c.BindJSON(&form); err == nil {
		db := c.MustGet("db").(*sql.DB)

		passwordHash, tokenString := models.SelectPasswordHashAndJWTToken(db, form.UsernameOrEmail)

		if isPasswordValid := _CheckPasswordHash(form.Password, passwordHash); isPasswordValid == true {
			isTokenValid, err := _ValidateJWTToken(tokenString, passwordHash)
			cError.CheckError(err)

			if isTokenValid == true {
				c.JSON(http.StatusMovedPermanently, gin.H{
					"status": "authorized",
					"token":  tokenString,
				})
			} else {
				c.JSON(http.StatusMovedPermanently, gin.H{"status": "unauthorized"})
			}
		} else {
			c.JSON(http.StatusMovedPermanently, gin.H{"status": "unauthorized"})
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
}
