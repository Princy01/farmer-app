package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func (h *AdminHandler) ListBranches(c *fiber.Ctx) error {
	var (
		businessID *int64
		branchID   *int
	)

	if id := c.Params("branch_id"); id != "" {
		parsed, err := strconv.Atoi(id)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid branch_id"})
		}
		branchID = &parsed
	}

	if id := c.Query("business_id"); id != "" {
		parsed, err := strconv.ParseInt(id, 10, 64)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid business_id"})
		}
		businessID = &parsed
	}

	data, err := h.service.ListBranches(businessID, branchID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to fetch branches"})
	}

	return c.JSON(data)
}

func (h *AdminHandler) ToggleBranchStatus(c *fiber.Ctx) error {
	branchID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid branch id"})
	}

	if err := h.service.ToggleBranchStatus(branchID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "failed to toggle branch status"})
	}

	return c.JSON(fiber.Map{"message": "branch status toggled"})
}
