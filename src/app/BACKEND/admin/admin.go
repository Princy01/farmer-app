package admin

import (
	"farmerapp/internal/admin/routes"

	"github.com/gofiber/fiber/v2"
)

func RegisterRoutes(r fiber.Router) {
	routes.RegisterRoutes(r)
}
