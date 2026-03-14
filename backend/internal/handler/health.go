package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthCheck handles the GET /health route
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "up",
		"message": "Contest Rating Engine is running",
	})
}
