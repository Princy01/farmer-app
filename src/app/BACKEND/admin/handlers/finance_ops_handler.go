package handlers

import (
	"errors"
	"strings"

	"farmerapp/internal/admin/models"
	financepkg "farmerapp/internal/finance"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) ListFinanceAllocations(c *fiber.Ctx) error {
	page, pageSize := parsePageParams(c)
	resp, err := h.service.ListFinanceAllocations(page, pageSize, parseCommaSeparatedStatuses(c.Query("statuses")))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch finance allocations"})
	}
	return c.JSON(resp)
}

func (h *AdminHandler) HoldFinanceAllocation(c *fiber.Ctx) error {
	userID, _, err := getAdminActorContext(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	allocationID, err := c.ParamsInt("allocation_id")
	if err != nil || allocationID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "invalid allocation id"})
	}

	var req models.FinanceAllocationActionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	allocation, err := h.service.HoldFinanceAllocation(int64(allocationID), userID, req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to hold finance allocation"})
	}
	return c.JSON(allocation)
}

func (h *AdminHandler) ReleaseFinanceAllocation(c *fiber.Ctx) error {
	userID, _, err := getAdminActorContext(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	allocationID, err := c.ParamsInt("allocation_id")
	if err != nil || allocationID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "invalid allocation id"})
	}

	var req models.FinanceAllocationActionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}

	allocation, err := h.service.ReleaseFinanceAllocation(int64(allocationID), userID, req)
	if err != nil {
		if errors.Is(err, financepkg.ErrAllocationNotReleasable) {
			return c.Status(400).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(500).JSON(fiber.Map{"error": "failed to release finance allocation"})
	}
	return c.JSON(allocation)
}

func (h *AdminHandler) ListFinanceExceptions(c *fiber.Ctx) error {
	page, pageSize := parsePageParams(c)
	resp, err := h.service.ListFinanceExceptions(page, pageSize, parseCommaSeparatedStatuses(c.Query("statuses")))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch finance exceptions"})
	}
	return c.JSON(resp)
}

func (h *AdminHandler) UpdateFinanceExceptionStatus(c *fiber.Ctx) error {
	userID, _, err := getAdminActorContext(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	}

	exceptionID, err := c.ParamsInt("exception_id")
	if err != nil || exceptionID <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "invalid exception id"})
	}

	var req models.FinanceExceptionStatusUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if strings.TrimSpace(req.Status) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "status is required"})
	}

	financeException, err := h.service.UpdateFinanceExceptionStatus(int64(exceptionID), userID, req)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to update finance exception"})
	}
	return c.JSON(financeException)
}

func parseCommaSeparatedStatuses(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	statuses := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			statuses = append(statuses, trimmed)
		}
	}
	return statuses
}
