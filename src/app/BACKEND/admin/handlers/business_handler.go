package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) ListBusinesses(c *fiber.Ctx) error {
	data, err := h.service.GetAllBusinesses()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch businesses"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) ToggleBusinessStatus(c *fiber.Ctx) error {
	businessID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid business id"})
	}

	if err := h.service.ToggleBusinessStatus(businessID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to toggle business status"})
	}

	return c.JSON(fiber.Map{"message": "business status toggled"})
}
