package handlers

import "github.com/gofiber/fiber/v2"

func (h *AdminHandler) GetOnboardingWatchSummary(c *fiber.Ctx) error {
	summary, err := h.service.GetOnboardingWatchSummary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch onboarding watch summary"})
	}
	return c.JSON(summary)
}

func (h *AdminHandler) ListOnboardingWatchItems(c *fiber.Ctx) error {
	page, pageSize := parsePageParams(c)
	resp, err := h.service.ListOnboardingWatchItems(
		page,
		pageSize,
		c.Query("watch_type"),
		c.Query("status"),
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch onboarding watch list"})
	}
	return c.JSON(resp)
}

func (h *AdminHandler) GetTransportWatchSummary(c *fiber.Ctx) error {
	summary, err := h.service.GetTransportWatchSummary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch transport watch summary"})
	}
	return c.JSON(summary)
}

func (h *AdminHandler) ListTransportWatchItems(c *fiber.Ctx) error {
	page, pageSize := parsePageParams(c)
	resp, err := h.service.ListTransportWatchItems(page, pageSize, c.Query("watch_type"))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch transport watch list"})
	}
	return c.JSON(resp)
}

func (h *AdminHandler) GetPaymentWatchSummary(c *fiber.Ctx) error {
	summary, err := h.service.GetPaymentWatchSummary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch payment watch summary"})
	}
	return c.JSON(summary)
}

func (h *AdminHandler) ListPaymentWatchItems(c *fiber.Ctx) error {
	page, pageSize := parsePageParams(c)
	resp, err := h.service.ListPaymentWatchItems(page, pageSize)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch payment watch list"})
	}
	return c.JSON(resp)
}

func parsePageParams(c *fiber.Ctx) (int, int) {
	page := c.QueryInt("page", 1)
	if page <= 0 {
		page = 1
	}
	pageSize := c.QueryInt("page_size", 20)
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return page, pageSize
}
