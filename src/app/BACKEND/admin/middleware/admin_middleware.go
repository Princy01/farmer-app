package middleware

import (
	"context"
	"strings"

	"farmerapp/go_backend/db"
	"farmerapp/internal/common/utils"

	"github.com/gofiber/fiber/v2"
)

const AdminRoleID = 1
const OpsL1RoleID = 6
const OpsL2RoleID = 7
const FinanceRoleID = 8

func AdminOnlyMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {

		userID, err := utils.GetUserIDFromContext(c)
		if err != nil || userID == 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}

		var roleID int
		query := `
			SELECT role_id
			FROM admin_schema.user_table
			WHERE user_id = $1
			AND active_status = 1
		`

		err = db.Pool.QueryRow(context.Background(), query, userID).Scan(&roleID)
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Access denied",
			})
		}

		if roleID != AdminRoleID {
			if isAllowedNonAdminAdminPath(c.Path(), roleID) {
				c.Locals("admin_user_id", userID)
				return c.Next()
			}
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Admin access only",
			})
		}

		c.Locals("admin_user_id", userID)
		return c.Next()
	}
}

func isAllowedNonAdminAdminPath(path string, roleID int) bool {
	switch {
	case strings.HasPrefix(path, "/admin/dispute-cases"):
		switch roleID {
		case OpsL1RoleID, OpsL2RoleID, FinanceRoleID:
			return true
		}
	case strings.HasPrefix(path, "/admin/branches/") &&
		(strings.HasSuffix(path, "/document-verification") || strings.HasSuffix(path, "/location-verification")):
		return false
	case strings.HasPrefix(path, "/admin/buyers/") &&
		(strings.HasSuffix(path, "/pan-verification") || strings.HasSuffix(path, "/aadhaar-verification")):
		return false
	case strings.HasPrefix(path, "/admin/wholesalers/") &&
		strings.HasSuffix(path, "/license-verification"):
		return false
	case strings.HasPrefix(path, "/admin/transporters/") &&
		(strings.HasSuffix(path, "/document-verification") || strings.HasSuffix(path, "/physical-verification")):
		return false
	case strings.HasPrefix(path, "/admin/ops-dashboard"):
		return roleID == OpsL1RoleID
	case strings.HasPrefix(path, "/admin/onboarding-watch"):
		return roleID == OpsL1RoleID
	case strings.HasPrefix(path, "/admin/transport-watch"):
		return roleID == OpsL1RoleID
	case strings.HasPrefix(path, "/admin/finance-dashboard"):
		return roleID == FinanceRoleID
	case strings.HasPrefix(path, "/admin/payment-watch"):
		return roleID == FinanceRoleID
	case strings.HasPrefix(path, "/admin/buyers"):
		return roleID == OpsL1RoleID || roleID == FinanceRoleID
	case strings.HasPrefix(path, "/admin/wholesalers"):
		return roleID == OpsL1RoleID || roleID == FinanceRoleID
	case strings.HasPrefix(path, "/admin/transporters"):
		return roleID == OpsL1RoleID
	}
	return false
}

func DisputeConsoleMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := utils.GetUserIDFromContext(c)
		if err != nil || userID == 0 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}

		var roleID int
		query := `
			SELECT role_id
			FROM admin_schema.user_table
			WHERE user_id = $1
			AND active_status = 1
		`

		err = db.Pool.QueryRow(context.Background(), query, userID).Scan(&roleID)
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Access denied",
			})
		}

		switch roleID {
		case AdminRoleID, OpsL1RoleID, OpsL2RoleID, FinanceRoleID:
			modules, err := listActiveDisputeModules(int64(userID))
			if err != nil {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "Access denied",
				})
			}
			if len(modules) == 0 {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "Dispute module access required",
				})
			}
			c.Locals("admin_user_id", userID)
			c.Locals("dispute_module_codes", modules)
			return c.Next()
		default:
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Dispute console access only",
			})
		}
	}
}

func listActiveDisputeModules(userID int64) ([]string, error) {
	rows, err := db.Pool.Query(context.Background(), `
		SELECT module_code
		FROM dispute_schema.module_user_access
		WHERE user_id = $1
			AND is_active = TRUE
		ORDER BY module_code ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	modules := make([]string, 0)
	for rows.Next() {
		var moduleCode string
		if err := rows.Scan(&moduleCode); err != nil {
			return nil, err
		}
		modules = append(modules, moduleCode)
	}
	return modules, rows.Err()
}
