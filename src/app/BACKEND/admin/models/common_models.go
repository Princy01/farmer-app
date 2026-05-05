package models

type City struct {
	ID             int    `json:"id"`
	City_ShortName string `json:"city_shortname"`
	City_Name      string `json:"city_name"`
	State_ID       int    `json:"state_id"`
}

type State struct {
	ID              int    `json:"id"`
	State_ShortName string `json:"state_shortname"`
	State_Name      string `json:"state_name"`
}

type Location struct {
	ID            int    `json:"id"`
	Location_Name string `json:"location_name"`
	City_Id       int    `json:"city_id"`
	State_Id      int    `json:"state_id"`
}

type Language struct {
	ID            int    `json:"id"`
	Language_Name string `json:"language_name"`
}
