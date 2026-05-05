package handlers

import (
	"strconv"

	"farmerapp/internal/admin/models"
	"farmerapp/internal/common/utils"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) CreateDispute(c *fiber.Ctx) error {
	var d models.Dispute

	if err := c.BodyParser(&d); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid payload"})
	}

	id, err := h.service.CreateDispute(&d)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to create dispute"})
	}

	return c.JSON(fiber.Map{"dispute_id": id})
}

func (h *AdminHandler) ListDisputes(c *fiber.Ctx) error {
	status := c.Query("status")
	var ptr *string
	if status != "" {
		ptr = &status
	}

	data, err := h.service.ListDisputes(ptr)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch disputes"})
	}

	return c.JSON(data)
}

func (h *AdminHandler) AddDisputeAction(c *fiber.Ctx) error {
	disputeID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid dispute id"})
	}

	userID, err := utils.GetUserIDFromContext(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	var req models.DisputeActionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid payload"})
	}

	if req.Action == "" || req.Status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "action and status are required"})
	}

	if err := h.service.AddDisputeAction(disputeID, userID, 1, req); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update dispute"})
	}

	return c.JSON(fiber.Map{"message": "dispute updated"})
}
