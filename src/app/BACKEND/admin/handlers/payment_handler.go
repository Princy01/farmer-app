package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) GetPaymentErrors(c *fiber.Ctx) error {
	orderID, err := strconv.ParseInt(c.Params("order_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid order id"})
	}

	data, err := h.service.GetPaymentErrors(orderID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch payment errors"})
	}

	return c.JSON(data)
}
