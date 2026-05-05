package handlers

import (
	"farmerapp/internal/admin/services"
	"farmerapp/internal/common/utils"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type AdminHandler struct {
	service *services.AdminService
}

func NewAdminHandler(service *services.AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

func (h *AdminHandler) GetDashboardSummary(c *fiber.Ctx) error {
	summary, err := h.service.GetDashboardSummary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch dashboard summary"})
	}
	return c.JSON(summary)
}

func (h *AdminHandler) GetControlTowerSummary(c *fiber.Ctx) error {
	summary, err := h.service.GetControlTowerSummary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch control tower summary"})
	}
	return c.JSON(summary)
}

func (h *AdminHandler) GetOpsDashboardSummary(c *fiber.Ctx) error {
	userID, roleID, err := getAdminActorContext(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	summary, err := h.service.GetOpsDashboardSummary(userID, roleID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch ops dashboard summary"})
	}
	return c.JSON(summary)
}

func (h *AdminHandler) GetFinanceDashboardSummary(c *fiber.Ctx) error {
	userID, roleID, err := getAdminActorContext(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	summary, err := h.service.GetFinanceDashboardSummary(userID, roleID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch finance dashboard summary"})
	}
	return c.JSON(summary)
}

func getAdminActorContext(c *fiber.Ctx) (int64, int, error) {
	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return 0, 0, err
	}

	roleID, err := getRoleIDFromLocals(c)
	if err != nil {
		return 0, 0, err
	}

	return int64(userID), roleID, nil
}

func getRoleIDFromLocals(c *fiber.Ctx) (int, error) {
	roleLocal := c.Locals("role_id")
	switch v := roleLocal.(type) {
	case float64:
		return int(v), nil
	case string:
		return strconv.Atoi(v)
	case int:
		return v, nil
	default:
		return 0, fiber.ErrUnauthorized
	}
}
