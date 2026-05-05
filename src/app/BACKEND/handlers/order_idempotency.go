package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"farmerapp/go_backend/db"

	"github.com/gofiber/fiber/v2"
)

const (
	orderIdempotencyEndpoint           = "CreateRetailerOrder"
	checkoutSessionIdempotencyEndpoint = "CreateRetailerCheckoutSession"
	orderIdempotencyLockTTL            = 30 * time.Second
	orderIdempotencyReplayWindow       = 2 * time.Minute
	orderIdempotencyWaitTimeout        = 15 * time.Second
	orderIdempotencyPollInterval       = 250 * time.Millisecond
	orderIdempotencyStatusRunning      = "processing"
	orderIdempotencyStatusDone         = "completed"
)

var (
	orderIdempotencySchemaOnce sync.Once
	orderIdempotencySchemaErr  error
)

type orderIdempotencyReplay struct {
	HTTPStatus int
	Body       []byte
}

type normalizedBatchOrderRequest struct {
	RetailerBusinessID int64                  `json:"retailer_business_id"`
	DateOfOrder        string                 `json:"date_of_order"`
	OrderStatus        int                    `json:"order_status"`
	DeliveryAddress    string                 `json:"delivery_address"`
	DeliveryAmount     float64                `json:"delivery_amount"`
	RetailerBranchID   int                    `json:"retailer_branch_id"`
	CheckoutSessionID  *int64                 `json:"checkout_session_id,omitempty"`
	OrderGroups        []normalizedOrderGroup `json:"order_groups"`
}

type normalizedOrderGroup struct {
	WholesellerID    int                   `json:"wholeseller_id"`
	BranchID         int                   `json:"branch_id"`
	TotalOrderAmount float64               `json:"total_order_amount"`
	DiscountAmount   float64               `json:"discount_amount"`
	TaxAmount        float64               `json:"tax_amount"`
	FinalAmount      float64               `json:"final_amount"`
	Items            []normalizedOrderItem `json:"items"`
}

type normalizedOrderItem struct {
	SelectedID     int64   `json:"selected_id"`
	ProductID      int64   `json:"product_id"`
	Quantity       float64 `json:"quantity"`
	UnitID         int     `json:"unit_id"`
	Price          float64 `json:"price"`
	DiscountAmount float64 `json:"discount_amount"`
	TaxAmount      float64 `json:"tax_amount"`
	WholesellerID  int     `json:"wholeseller_id"`
	BranchID       int64   `json:"branch_id"`
}

func ensureOrderIdempotencySchema(ctx context.Context) error {
	orderIdempotencySchemaOnce.Do(func() {
		_, err := db.Pool.Exec(ctx, `
			CREATE TABLE IF NOT EXISTS admin_schema.order_idempotency (
				endpoint TEXT NOT NULL,
				idempotency_key TEXT NOT NULL,
				retailer_id BIGINT NOT NULL,
				request_hash TEXT NOT NULL,
				status TEXT NOT NULL,
				http_status INTEGER,
				response_json JSONB,
				locked_until TIMESTAMPTZ NOT NULL,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				PRIMARY KEY (endpoint, idempotency_key)
			);
		`)
		if err != nil {
			orderIdempotencySchemaErr = err
			return
		}

		_, err = db.Pool.Exec(ctx, `
			CREATE INDEX IF NOT EXISTS idx_order_idempotency_updated_at
			ON admin_schema.order_idempotency (updated_at);
		`)
		if err != nil {
			orderIdempotencySchemaErr = err
		}
	})
	return orderIdempotencySchemaErr
}

func deriveOrderIdempotencyKey(c *fiber.Ctx, retailerBusinessID int64, req CreateBatchOrderRequest) (string, string, error) {
	clientKey := strings.TrimSpace(c.Get("X-Idempotency-Key"))
	if clientKey == "" {
		clientKey = strings.TrimSpace(c.Get("Idempotency-Key"))
	}

	hash, err := hashNormalizedBatchOrderRequest(retailerBusinessID, req)
	if err != nil {
		return "", "", err
	}

	if clientKey != "" {
		return "client:" + clientKey, hash, nil
	}
	return "auto:" + hash, hash, nil
}

func hashNormalizedBatchOrderRequest(retailerBusinessID int64, req CreateBatchOrderRequest) (string, error) {
	normalized := normalizedBatchOrderRequest{
		RetailerBusinessID: retailerBusinessID,
		DateOfOrder:        req.DateOfOrder,
		OrderStatus:        req.OrderStatus,
		DeliveryAddress:    strings.TrimSpace(req.DeliveryAddress),
		DeliveryAmount:     req.DeliveryAmount,
		RetailerBranchID:   req.RetailerBranchID,
		CheckoutSessionID:  req.CheckoutSessionID,
		OrderGroups:        make([]normalizedOrderGroup, 0, len(req.OrderGroups)),
	}

	for _, group := range req.OrderGroups {
		normGroup := normalizedOrderGroup{
			WholesellerID:    group.WholesellerID,
			BranchID:         group.BranchID,
			TotalOrderAmount: group.TotalOrderAmount,
			DiscountAmount:   group.DiscountAmount,
			TaxAmount:        group.TaxAmount,
			FinalAmount:      group.FinalAmount,
			Items:            make([]normalizedOrderItem, 0, len(group.Items)),
		}

		for _, item := range group.Items {
			normGroup.Items = append(normGroup.Items, normalizedOrderItem{
				SelectedID:     item.SelectedID,
				ProductID:      item.ProductID,
				Quantity:       item.Quantity,
				UnitID:         item.UnitID,
				Price:          item.Price,
				DiscountAmount: item.Discount,
				TaxAmount:      item.TaxAmount,
				WholesellerID:  item.WholesellerID,
				BranchID:       item.BranchID,
			})
		}

		sort.Slice(normGroup.Items, func(i, j int) bool {
			left := normGroup.Items[i]
			right := normGroup.Items[j]
			if left.WholesellerID != right.WholesellerID {
				return left.WholesellerID < right.WholesellerID
			}
			if left.BranchID != right.BranchID {
				return left.BranchID < right.BranchID
			}
			if left.ProductID != right.ProductID {
				return left.ProductID < right.ProductID
			}
			if left.UnitID != right.UnitID {
				return left.UnitID < right.UnitID
			}
			if left.Price != right.Price {
				return left.Price < right.Price
			}
			if left.Quantity != right.Quantity {
				return left.Quantity < right.Quantity
			}
			return left.SelectedID < right.SelectedID
		})

		normalized.OrderGroups = append(normalized.OrderGroups, normGroup)
	}

	sort.Slice(normalized.OrderGroups, func(i, j int) bool {
		left := normalized.OrderGroups[i]
		right := normalized.OrderGroups[j]
		if left.WholesellerID != right.WholesellerID {
			return left.WholesellerID < right.WholesellerID
		}
		if left.BranchID != right.BranchID {
			return left.BranchID < right.BranchID
		}
		if left.FinalAmount != right.FinalAmount {
			return left.FinalAmount < right.FinalAmount
		}
		return len(left.Items) < len(right.Items)
	})

	payload, err := json.Marshal(normalized)
	if err != nil {
		return "", err
	}

	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:]), nil
}

func acquireOrderIdempotency(ctx context.Context, endpoint, key, requestHash string, retailerID int64) (*orderIdempotencyReplay, bool, error) {
	if err := ensureOrderIdempotencySchema(ctx); err != nil {
		return nil, false, fmt.Errorf("ensure idempotency schema: %w", err)
	}

	if _, err := db.Pool.Exec(ctx, `
		DELETE FROM admin_schema.order_idempotency
		WHERE endpoint = $1
		  AND idempotency_key = $2
		  AND updated_at < NOW() - ($3 * INTERVAL '1 second')
	`, endpoint, key, int(orderIdempotencyReplayWindow.Seconds())); err != nil {
		return nil, false, fmt.Errorf("cleanup stale idempotency rows: %w", err)
	}

	lockedUntil := time.Now().Add(orderIdempotencyLockTTL)
	result, err := db.Pool.Exec(ctx, `
		INSERT INTO admin_schema.order_idempotency
			(endpoint, idempotency_key, retailer_id, request_hash, status, locked_until, created_at, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, NOW(), NOW())
		ON CONFLICT DO NOTHING
	`, endpoint, key, retailerID, requestHash, orderIdempotencyStatusRunning, lockedUntil)
	if err != nil {
		return nil, false, fmt.Errorf("insert idempotency row: %w", err)
	}
	if result.RowsAffected() == 1 {
		return nil, true, nil
	}

	deadline := time.Now().Add(orderIdempotencyWaitTimeout)
	for {
		var status string
		var httpStatus *int
		var responseJSON []byte
		var currentLockedUntil time.Time

		err := db.Pool.QueryRow(ctx, `
			SELECT status, http_status, response_json::text, locked_until
			FROM admin_schema.order_idempotency
			WHERE endpoint = $1 AND idempotency_key = $2
		`, endpoint, key).Scan(&status, &httpStatus, &responseJSON, &currentLockedUntil)
		if err != nil {
			return nil, false, fmt.Errorf("load idempotency row: %w", err)
		}

		if status == orderIdempotencyStatusDone && httpStatus != nil && len(responseJSON) > 0 {
			return &orderIdempotencyReplay{
				HTTPStatus: *httpStatus,
				Body:       responseJSON,
			}, false, nil
		}

		if status == orderIdempotencyStatusRunning && time.Now().After(currentLockedUntil) {
			takeoverUntil := time.Now().Add(orderIdempotencyLockTTL)
			takeover, err := db.Pool.Exec(ctx, `
				UPDATE admin_schema.order_idempotency
				SET locked_until = $3, updated_at = NOW()
				WHERE endpoint = $1
				  AND idempotency_key = $2
				  AND status = $4
				  AND locked_until < NOW()
			`, endpoint, key, takeoverUntil, orderIdempotencyStatusRunning)
			if err != nil {
				return nil, false, fmt.Errorf("take over stale idempotency row: %w", err)
			}
			if takeover.RowsAffected() == 1 {
				return nil, true, nil
			}
		}

		if time.Now().After(deadline) {
			return nil, false, fiber.NewError(fiber.StatusConflict, "An identical order request is already being processed")
		}

		time.Sleep(orderIdempotencyPollInterval)
	}
}

func completeOrderIdempotency(ctx context.Context, endpoint, key string, httpStatus int, responseBody []byte) error {
	if len(responseBody) == 0 {
		return fmt.Errorf("empty idempotency response body")
	}

	_, err := db.Pool.Exec(ctx, `
		UPDATE admin_schema.order_idempotency
		SET status = $3,
		    http_status = $4,
		    response_json = $5::jsonb,
		    updated_at = NOW(),
		    locked_until = NOW()
		WHERE endpoint = $1 AND idempotency_key = $2
	`, endpoint, key, orderIdempotencyStatusDone, httpStatus, string(responseBody))
	return err
}

func abandonOrderIdempotency(ctx context.Context, endpoint, key string) error {
	_, err := db.Pool.Exec(ctx, `
		DELETE FROM admin_schema.order_idempotency
		WHERE endpoint = $1 AND idempotency_key = $2
	`, endpoint, key)
	return err
}
