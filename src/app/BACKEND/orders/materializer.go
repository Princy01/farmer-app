package orders

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"farmerapp/internal/checkout"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
)

const materializedOrderStatusCreated = 1

type queryer interface {
	Query(context.Context, string, ...interface{}) (pgx.Rows, error)
	QueryRow(context.Context, string, ...interface{}) pgx.Row
	Exec(context.Context, string, ...interface{}) (pgconn.CommandTag, error)
}

type Materializer struct {
	checkoutRepo *checkout.Repository
}

type MaterializedOrderLink struct {
	OrderID       int64
	WholesellerID int
}

type MaterializationResult struct {
	OrderIDs []int64
	Links    []MaterializedOrderLink
}

type groupedOrder struct {
	WholesellerID int
	Items         []materializedItem
	GoodsAmount   float64
	Discount      float64
	TaxAmount     float64
	FinalAmount   float64
}

type materializedItem struct {
	SelectedID      int64   `json:"selected_id,omitempty"`
	ProductID       int64   `json:"product_id"`
	ProductName     string  `json:"product_name"`
	Quantity        float64 `json:"quantity"`
	UnitID          int     `json:"unit_id"`
	UnitName        string  `json:"unit_name"`
	Price           float64 `json:"price"`
	Discount        float64 `json:"discount_amount"`
	TaxAmount       float64 `json:"tax_amount"`
	WholesellerID   int     `json:"wholeseller_id"`
	WholesellerName string  `json:"wholeseller_name"`
	BranchID        int64   `json:"branch_id"`
}

func NewMaterializer() *Materializer {
	return &Materializer{
		checkoutRepo: checkout.NewRepository(),
	}
}

func (m *Materializer) MaterializeCheckoutSession(
	ctx context.Context,
	q queryer,
	session *checkout.CheckoutSession,
	items []checkout.CheckoutSessionItem,
) (*MaterializationResult, error) {
	if session == nil {
		return nil, fmt.Errorf("checkout session is required")
	}
	if q == nil {
		return nil, fmt.Errorf("materialization queryer is required")
	}

	if session.Status == checkout.StatusMaterialized {
		return m.loadExistingMaterializedOrders(ctx, q, session.CheckoutSessionID)
	}
	if session.Status != checkout.StatusPaymentCaptured {
		return nil, fmt.Errorf("checkout session %d is not ready for materialization from status %s", session.CheckoutSessionID, session.Status)
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("checkout session %d has no items to materialize", session.CheckoutSessionID)
	}

	grouped := groupCheckoutItems(items)
	if len(grouped) == 0 {
		return nil, fmt.Errorf("checkout session %d produced no grouped orders", session.CheckoutSessionID)
	}

	dateOfOrder := time.Now().Format("2006-01-02")
	if session.SourceCartDate != nil {
		dateOfOrder = session.SourceCartDate.Format("2006-01-02")
	}

	result := &MaterializationResult{
		OrderIDs: make([]int64, 0, len(grouped)),
		Links:    make([]MaterializedOrderLink, 0, len(grouped)),
	}

	for _, group := range grouped {
		itemsJSON, err := json.Marshal(group.Items)
		if err != nil {
			return nil, fmt.Errorf("marshal materialized items for wholeseller %d: %w", group.WholesellerID, err)
		}

		var orderID int64
		if err := q.QueryRow(
			ctx,
			`SELECT business_schema.insert_order(
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
			)`,
			dateOfOrder,
			materializedOrderStatusCreated,
			session.RetailerID,
			group.WholesellerID,
			group.GoodsAmount,
			group.Discount,
			group.TaxAmount,
			session.DeliveryAmount,
			group.FinalAmount,
			session.DeliveryAddress,
			string(itemsJSON),
			nil,
			nil,
			nil,
			nil,
			nil,
			session.RetailerBranchID,
		).Scan(&orderID); err != nil {
			return nil, fmt.Errorf("insert materialized order for wholeseller %d: %w", group.WholesellerID, err)
		}

		if _, err := m.checkoutRepo.AddCheckoutSessionOrder(ctx, q, checkout.CreateCheckoutSessionOrderParams{
			CheckoutSessionID: session.CheckoutSessionID,
			OrderID:           orderID,
			WholesellerID:     group.WholesellerID,
		}); err != nil {
			return nil, fmt.Errorf("link checkout session %d to order %d: %w", session.CheckoutSessionID, orderID, err)
		}

		result.OrderIDs = append(result.OrderIDs, orderID)
		result.Links = append(result.Links, MaterializedOrderLink{
			OrderID:       orderID,
			WholesellerID: group.WholesellerID,
		})
	}

	if _, err := m.checkoutRepo.MarkCheckoutSessionMaterialized(ctx, q, session.CheckoutSessionID, time.Now()); err != nil {
		return nil, fmt.Errorf("mark checkout session %d materialized: %w", session.CheckoutSessionID, err)
	}

	return result, nil
}

func (m *Materializer) loadExistingMaterializedOrders(ctx context.Context, q queryer, checkoutSessionID int64) (*MaterializationResult, error) {
	existingOrders, err := m.checkoutRepo.ListCheckoutSessionOrders(ctx, q, checkoutSessionID)
	if err != nil {
		return nil, fmt.Errorf("list existing materialized orders for checkout session %d: %w", checkoutSessionID, err)
	}
	if len(existingOrders) == 0 {
		return nil, fmt.Errorf("checkout session %d is marked materialized without linked orders", checkoutSessionID)
	}

	result := &MaterializationResult{
		OrderIDs: make([]int64, 0, len(existingOrders)),
		Links:    make([]MaterializedOrderLink, 0, len(existingOrders)),
	}
	for _, existingOrder := range existingOrders {
		result.OrderIDs = append(result.OrderIDs, existingOrder.OrderID)
		result.Links = append(result.Links, MaterializedOrderLink{
			OrderID:       existingOrder.OrderID,
			WholesellerID: existingOrder.WholesellerID,
		})
	}

	return result, nil
}

func groupCheckoutItems(items []checkout.CheckoutSessionItem) []groupedOrder {
	groups := make(map[int]*groupedOrder)
	order := make([]int, 0)

	for _, item := range items {
		group := groups[item.WholesellerID]
		if group == nil {
			group = &groupedOrder{WholesellerID: item.WholesellerID}
			groups[item.WholesellerID] = group
			order = append(order, item.WholesellerID)
		}

		group.Items = append(group.Items, materializedItem{
			SelectedID:      derefInt64(item.SelectedItemID),
			ProductID:       item.ProductID,
			ProductName:     derefString(item.ProductNameSnapshot),
			Quantity:        item.Quantity,
			UnitID:          item.UnitID,
			UnitName:        derefString(item.UnitNameSnapshot),
			Price:           item.UnitPrice,
			Discount:        item.DiscountAmount,
			TaxAmount:       item.TaxAmount,
			WholesellerID:   item.WholesellerID,
			WholesellerName: "",
			BranchID:        derefInt64(item.WholesellerBranchID),
		})
		group.GoodsAmount += item.LineGoodsAmount
		group.Discount += item.DiscountAmount
		group.TaxAmount += item.TaxAmount
		group.FinalAmount += item.LineFinalAmount
	}

	grouped := make([]groupedOrder, 0, len(order))
	for _, wholesellerID := range order {
		grouped = append(grouped, *groups[wholesellerID])
	}

	return grouped
}

func derefInt64(value *int64) int64 {
	if value == nil {
		return 0
	}
	return *value
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
