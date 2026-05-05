package models

type UserListItem struct {
	UserID    int     `json:"user_id"`
	Name      string  `json:"name"`
	Email     *string `json:"email"`
	MobileNum *string `json:"mobile_num"`
	RoleID    int     `json:"role_id"`
	IsActive  bool    `json:"is_active"`
}
