package handlers

import "github.com/gofiber/fiber/v2"

func (h *AdminHandler) ListUsers(c *fiber.Ctx) error {
	users, err := h.service.GetAllUsers()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch users"})
	}
	return c.JSON(users)
}

func (h *AdminHandler) ToggleUserStatus(c *fiber.Ctx) error {
	userID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid user id"})
	}

	if err := h.service.ToggleUserStatus(userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to toggle user status"})
	}

	return c.JSON(fiber.Map{"message": "user status toggled"})
}
