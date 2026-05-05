package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) ListEscrows(c *fiber.Ctx) error {
	data, err := h.service.ListEscrows()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch escrows"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) UpdateEscrowStatus(c *fiber.Ctx) error {
	escrowID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid escrow id"})
	}

	status := c.Query("status")
	if status == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status required"})
	}

	if err := h.service.UpdateEscrowStatus(escrowID, status); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update escrow"})
	}

	return c.JSON(fiber.Map{"message": "escrow updated"})
}

func (h *AdminHandler) EscrowSummary(c *fiber.Ctx) error {
	data, err := h.service.GetEscrowStatusSummary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch escrow summary"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) EscrowAging(c *fiber.Ctx) error {
	days, _ := strconv.Atoi(c.Query("days", "7"))

	data, err := h.service.GetEscrowsHeldMoreThan(days)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch escrow aging"})
	}
	return c.JSON(data)
}
