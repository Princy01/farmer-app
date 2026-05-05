package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) DailyTransactions(c *fiber.Ctx) error {
	data, err := h.service.GetDailyTransactions(c.Query("from"), c.Query("to"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch transactions"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) DailyRevenue(c *fiber.Ctx) error {
	data, err := h.service.GetDailyRevenue(c.Query("from"), c.Query("to"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch revenue"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) DailyDisputes(c *fiber.Ctx) error {
	data, err := h.service.GetDailyDisputes(c.Query("from"), c.Query("to"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch disputes"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) StuckOrders(c *fiber.Ctx) error {
	days, errConv := strconv.Atoi(c.Query("days"))
	if errConv != nil {
		days = 3
	}
	data, err := h.service.GetStuckOrders(days)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch stuck orders"})
	}
	return c.JSON(data)
}

func (h *AdminHandler) TopDisputedBusinesses(c *fiber.Ctx) error {
	data, err := h.service.GetTopDisputedBusinesses(c.Query("from"), c.Query("to"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch top disputed businesses"})
	}
	return c.JSON(data)
}
