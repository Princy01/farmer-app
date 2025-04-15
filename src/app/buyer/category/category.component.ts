import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonModal } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chevronBack, search, funnelOutline, swapVerticalOutline, heartOutline, cartOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { BuyerApiService } from '../services/buyer-api.service';
import { catchError, delay, of, switchMap, tap } from 'rxjs';

@Component({
    selector: 'app-category-page',
    standalone: true,
    imports: [CommonModule, IonicModule, FormsModule],
templateUrl: './category.component.html',
    styleUrls: ['./category.component.scss'],
})
export class CategoryPageComponent {
    @ViewChild('filterModal') filterModal!: IonModal;
    @ViewChild('sortModal') sortModal!: IonModal;
    @ViewChild('productModal') productModal!: IonModal;

    selectedSegment: string = 'nutrition';
    isSearchActive = false;
    searchQuery = '';
    categoryName: string = '';
    selectedSubcategory: string | null = null;
    selectedSubcategoryItems: any[] = [];
    filteredAndSortedItems: any[] = [];

    // IDs for navigation and selection
    categoryId: number = -1;
    selectedCategoryId: number = -1;
    selectedSubcategoryId: number = -1;

    // Unified data structures
    //   categories: any[] = []; // Will store both main categories and subcategories
    categories: any[] = [
        // Main categories
        { id: 1, name: 'Vegetables', hindiName: 'सब्जियां', image: 'assets/img/Vegetables2.png', parentId: null },
        { id: 2, name: 'Fruits', hindiName: 'फल', image: 'assets/img/Fruits.png', parentId: null },
        { id: 3, name: 'Grains', hindiName: 'अनाज', image: 'assets/img/Grains.png', parentId: null },
        { id: 4, name: 'Pulses', hindiName: 'दालें', image: 'assets/img/Pulses.png', parentId: null },

        // Vegetable subcategories
        { id: 5, name: 'All', hindiName: 'सभी', image: 'assets/img/Vegetables2.png', parentId: 1 },
        { id: 6, name: 'Leafy Greens', hindiName: 'पत्तेदार सब्जियां', image: 'assets/img/Spinach2.png', parentId: 1 },
        { id: 7, name: 'Root Vegetables', hindiName: 'जड़ वाली सब्जियां', image: 'assets/img/Carrot1.png', parentId: 1 },
        { id: 8, name: 'Bulbs', hindiName: 'बल्ब सब्जियां', image: 'assets/img/Onion1.png', parentId: 1 },
        { id: 9, name: 'Beans & Peas', hindiName: 'बीन्स और मटर', image: 'assets/img/Peas1.png', parentId: 1 },
        { id: 10, name: 'Fruity Vegetables', hindiName: 'फल वाली सब्जियां', image: 'assets/img/Tomato1.png', parentId: 1 },
        { id: 11, name: 'Tubers', hindiName: 'कंद वाली सब्जियां', image: 'assets/img/Potato1.png', parentId: 1 },

        // Fruit subcategories
        { id: 12, name: 'All', hindiName: 'सभी', image: 'assets/img/Fruits.png', parentId: 2 },
        { id: 13, name: 'Citrus Fruits', hindiName: 'खट्टे फल', image: 'assets/img/oranges.png', parentId: 2 },
        { id: 14, name: 'Berries', hindiName: 'बेरी फल', image: 'assets/img/strawberries.png', parentId: 2 },
        { id: 15, name: 'Stone Fruits', hindiName: 'गुठली वाले फल', image: 'assets/img/mangoes.png', parentId: 2 },
        { id: 16, name: 'Tropical Fruits', hindiName: 'उष्णकटिबंधीय फल', image: 'assets/img/bananas.png', parentId: 2 },

        // Grain subcategories
        { id: 17, name: 'All', hindiName: 'सभी', image: 'assets/img/Grains.png', parentId: 3 },
        { id: 18, name: 'Cereal Grains', hindiName: 'अनाज', image: 'assets/img/rice.png', parentId: 3 },
        { id: 19, name: 'Millets', hindiName: 'बाजरा एवं अन्य मोटे अनाज', image: 'assets/img/millets.png', parentId: 3 },

        // Pulses subcategories
        { id: 20, name: 'All', hindiName: 'सभी', image: 'assets/img/Pulses.png', parentId: 4 },
        { id: 21, name: 'Lentils', hindiName: 'मसूर', image: 'assets/img/lentils.png', parentId: 4 },
        { id: 22, name: 'Beans', hindiName: 'सेम', image: 'assets/img/beans.png', parentId: 4 }
    ];
    products = [
        // Vegetable products - Leafy Greens (categoryId: 6)
        {
            id: 1,
            name: 'Spinach',
            hindiName: 'पालक',
            image: 'assets/img/Spinach2.png',
            price: 50,
            quantity: '250g',
            discount: 5,
            rating: 4.5,
            inStock: true,
            deliveryTime: '1-3 days',
            organic: true,
            minOrderQty: 2,
            categoryId: 6,
            mandi: { name: 'Azadpur Mandi', location: 'Delhi' },
            wholesalers: [
                { name: 'Agro Traders Pvt Ltd', price: 38, earliestDelivery: 'March 12, 2025', wastage: 5, rating: 4.3 },
                { name: 'Green Fresh Supplies', price: 39, earliestDelivery: 'March 11, 2025', wastage: 4, rating: 4.7 },
            ]
        },

        // Vegetable products - Root Vegetables (categoryId: 7)
        {
            id: 2,
            name: 'Carrots',
            hindiName: 'गाजर',
            image: 'assets/img/Carrot1.png',
            price: 35,
            quantity: '500g',
            discount: 5,
            rating: 4.5,
            inStock: true,
            deliveryTime: '2-4 days',
            organic: true,
            minOrderQty: 2,
            categoryId: 7,
            mandi: { name: 'Kolkata Mandi', location: 'West Bengal' },
            wholesalers: [
                { name: 'Eastern Agro Traders', price: 32, earliestDelivery: 'March 10, 2025', wastage: 6, rating: 4.1 },
                { name: 'Bengal Fresh Wholesale', price: 34, earliestDelivery: 'March 9, 2025', wastage: 5, rating: 4.5 },
            ]
        },

        // Vegetable products - Bulbs (categoryId: 8)
        {
            id: 3,
            name: 'Onions',
            hindiName: 'प्याज',
            image: 'assets/img/Onion1.png',
            price: 20,
            quantity: '1kg',
            discount: 2,
            rating: 4.1,
            inStock: true,
            deliveryTime: '1-3 days',
            organic: false,
            minOrderQty: 1,
            categoryId: 8,
            mandi: { name: 'Lasalgaon Mandi', location: 'Maharashtra' },
            wholesalers: [
                { name: 'Nashik Onion Traders', price: 18, earliestDelivery: 'March 11, 2025', wastage: 7, rating: 4.0 },
                { name: 'Fresh Onion Wholesalers', price: 19, earliestDelivery: 'March 10, 2025', wastage: 6, rating: 4.2 },
            ]
        },

        // Vegetable products - Beans & Peas (categoryId: 9)
        {
            id: 4,
            name: 'Green Beans',
            hindiName: 'हरी बीन्स',
            image: 'assets/img/green_beans.png',
            price: 40,
            quantity: '500g',
            discount: 5,
            rating: 4.5,
            inStock: true,
            deliveryTime: '2-4 days',
            organic: true,
            minOrderQty: 2,
            categoryId: 9,
            mandi: { name: 'Pune Mandi', location: 'Maharashtra' },
            wholesalers: [
                { name: 'Farm Fresh Beans', price: 38, earliestDelivery: 'March 13, 2025', wastage: 5, rating: 4.4 },
                { name: 'Organic Green Traders', price: 39, earliestDelivery: 'March 12, 2025', wastage: 4, rating: 4.6 },
            ]
        },

        // Vegetable products - Fruity Vegetables (categoryId: 10)
        {
            id: 5,
            name: 'Tomatoes',
            hindiName: 'टमाटर',
            image: 'assets/img/tomatoes.png',
            price: 30,
            quantity: '1kg',
            discount: 3,
            rating: 4.2,
            inStock: false,
            deliveryTime: '3-5 days',
            organic: true,
            minOrderQty: 1,
            categoryId: 10,
            mandi: { name: 'Koyambedu Mandi', location: 'Chennai' },
            wholesalers: [
                { name: 'South India Tomatoes', price: 28, earliestDelivery: 'March 14, 2025', wastage: 8, rating: 4.0 },
                { name: 'Chennai Agro Wholesalers', price: 29, earliestDelivery: 'March 13, 2025', wastage: 7, rating: 4.3 },
            ]
        },

        // Vegetable products - Tubers (categoryId: 11)
        {
            id: 6,
            name: 'Potatoes',
            hindiName: 'आलू',
            image: 'assets/img/potatoes.png',
            price: 25,
            quantity: '1kg',
            discount: 3,
            rating: 4.2,
            inStock: false,
            deliveryTime: '3-5 days',
            organic: true,
            minOrderQty: 1,
            categoryId: 11,
            mandi: { name: 'Kanpur Mandi', location: 'Uttar Pradesh' },
            wholesalers: [
                { name: 'UP Fresh Potato Traders', price: 22, earliestDelivery: 'March 15, 2025', wastage: 6, rating: 4.1 },
                { name: 'Golden Potatoes Ltd', price: 23, earliestDelivery: 'March 14, 2025', wastage: 5, rating: 4.4 },
            ]
        },

        // Fruit products - Citrus Fruits (categoryId: 13)
        {
            id: 7,
            name: 'Oranges',
            hindiName: 'संतरा',
            image: 'assets/img/oranges.png',
            price: 60,
            quantity: '1kg',
            discount: 10,
            rating: 4.3,
            inStock: true,
            deliveryTime: '1-2 days',
            organic: false,
            minOrderQty: 1,
            categoryId: 13,
            mandi: { name: 'Nagpur Mandi', location: 'Maharashtra' },
            wholesalers: [
                { name: 'Maharashtra Orange Traders', price: 55, earliestDelivery: 'March 12, 2025', wastage: 4, rating: 4.4 },
                { name: 'Fresh Citrus Suppliers', price: 57, earliestDelivery: 'March 11, 2025', wastage: 5, rating: 4.6 },
            ]
        },

        // Fruit products - Berries (categoryId: 14)
        {
            id: 8,
            name: 'Strawberries',
            hindiName: 'स्ट्रॉबेरी',
            image: 'assets/img/strawberries.png',
            price: 120,
            quantity: '500g',
            discount: 5,
            rating: 4.7,
            inStock: true,
            deliveryTime: '2-3 days',
            organic: true,
            minOrderQty: 2,
            categoryId: 14,
            mandi: { name: 'Mahabaleshwar Mandi', location: 'Maharashtra' },
            wholesalers: [
                { name: 'Mahabaleshwar Fresh Berries', price: 110, earliestDelivery: 'March 10, 2025', wastage: 3, rating: 4.8 },
                { name: 'Organic Strawberry Suppliers', price: 115, earliestDelivery: 'March 9, 2025', wastage: 4, rating: 4.7 },
            ]
        },

        // Fruit products - Stone Fruits (categoryId: 15)
        {
            id: 9,
            name: 'Mangoes',
            hindiName: 'आम',
            image: 'assets/img/mangoes.png',
            price: 100,
            quantity: '1kg',
            discount: 8,
            rating: 4.6,
            inStock: true,
            deliveryTime: '1-3 days',
            organic: true,
            minOrderQty: 1,
            categoryId: 15,
            mandi: { name: 'Ratnagiri Mandi', location: 'Maharashtra' },
            wholesalers: [
                { name: 'Ratnagiri Alphonso Suppliers', price: 95, earliestDelivery: 'March 15, 2025', wastage: 6, rating: 4.5 },
                { name: 'Golden Mango Traders', price: 98, earliestDelivery: 'March 14, 2025', wastage: 5, rating: 4.6 },
            ]
        },

        // Fruit products - Tropical Fruits (categoryId: 16)
        {
            id: 10,
            name: 'Bananas',
            hindiName: 'केला',
            image: 'assets/img/bananas.png',
            price: 40,
            quantity: '1 dozen',
            discount: 0,
            rating: 4.5,
            inStock: true,
            deliveryTime: '1 day',
            organic: false,
            minOrderQty: 3,
            categoryId: 16,
            mandi: { name: 'Kolkata Banana Mandi', location: 'West Bengal' },
            wholesalers: [
                { name: 'Fresh Banana Suppliers', price: 35, earliestDelivery: 'March 13, 2025', wastage: 5, rating: 4.3 },
                { name: 'Organic Banana Traders', price: 38, earliestDelivery: 'March 12, 2025', wastage: 4, rating: 4.5 },
            ]
        },

        // Grain products - Cereal Grains (categoryId: 18)
        {
            id: 11,
            name: 'Rice',
            hindiName: 'चावल',
            image: 'assets/img/rice.png',
            price: 60,
            quantity: '1kg',
            discount: 5,
            rating: 4.2,
            inStock: true,
            deliveryTime: '2-3 days',
            organic: true,
            minOrderQty: 1,
            categoryId: 18,
            mandi: { name: 'Karnal Grain Mandi', location: 'Haryana' },
            wholesalers: [
                { name: 'Haryana Rice Suppliers', price: 58, earliestDelivery: 'March 14, 2025', wastage: 3, rating: 4.5 },
                { name: 'Best Basmati Traders', price: 60, earliestDelivery: 'March 13, 2025', wastage: 4, rating: 4.6 },
            ]
        },

        // Grain products - Millets (categoryId: 19)
        {
            id: 12,
            name: 'Bajra (Pearl Millet)',
            hindiName: 'बाजरा',
            image: 'assets/img/bajra.png',
            price: 80,
            quantity: '1kg',
            discount: 7,
            rating: 4.5,
            inStock: true,
            deliveryTime: '3-4 days',
            organic: true,
            minOrderQty: 2,
            categoryId: 19,
            mandi: { name: 'Jaipur Mandi', location: 'Rajasthan' },
            wholesalers: [
                { name: 'Rajasthan Millet Traders', price: 75, earliestDelivery: 'March 15, 2025', wastage: 2, rating: 4.7 },
                { name: 'Organic Bajra Suppliers', price: 78, earliestDelivery: 'March 14, 2025', wastage: 3, rating: 4.6 },
            ]
        },

        // Pulses products - Lentils (categoryId: 21)
        {
            id: 13,
            name: 'Red Lentils (Masoor)',
            hindiName: 'मसूर दाल',
            image: 'assets/img/masoor_lentils.png',
            price: 90,
            quantity: '1kg',
            discount: 5,
            rating: 4.3,
            inStock: true,
            deliveryTime: '2-3 days',
            organic: true,
            minOrderQty: 1,
            categoryId: 21,
            mandi: { name: 'Indore Mandi', location: 'Madhya Pradesh' },
            wholesalers: [
                { name: 'Madhya Pradesh Lentils Traders', price: 85, earliestDelivery: 'March 12, 2025', wastage: 4, rating: 4.5 },
                { name: 'Organic Dal Suppliers', price: 88, earliestDelivery: 'March 11, 2025', wastage: 3, rating: 4.6 },
            ]
        },

        // Pulses products - Beans (categoryId: 22)
        {
            id: 14,
            name: 'Kidney Beans (Rajma)',
            hindiName: 'राजमा',
            image: 'assets/img/kidney_beans.png',
            price: 110,
            quantity: '1kg',
            discount: 8,
            rating: 4.6,
            inStock: true,
            deliveryTime: '3-4 days',
            organic: false,
            minOrderQty: 2,
            categoryId: 22,
            mandi: { name: 'Jammu Rajma Mandi', location: 'Jammu & Kashmir' },
            wholesalers: [
                { name: 'Jammu Rajma Suppliers', price: 105, earliestDelivery: 'March 14, 2025', wastage: 5, rating: 4.4 },
                { name: 'Premium Rajma Traders', price: 108, earliestDelivery: 'March 13, 2025', wastage: 4, rating: 4.7 },
            ]
        }
    ];

    // Filters
    selectedFilter: string | null = null; // Track selected filter section
    filterQuery: string = '';
    priceRangeMin: number = 0;
    priceRangeMax: number = 150;
    priceRangeValues: { lower: number; upper: number } = { lower: 0, upper: 150 };
    availability: boolean = false;
    quantityDiscount: boolean = false;
    deliveryTime: string = 'any';
    organic: boolean | null = null;
    sellerRatings: number = 0;
    minimumOrderQuantity: number = 0;

    // Available filter categories
    filterCategories = [
        { id: 'price', label: 'Price' },
        { id: 'availability', label: 'Availability' },
        { id: 'discount', label: 'Discount' },
        { id: 'delivery', label: 'Delivery Time' },
        { id: 'organic', label: 'Organic' },
        { id: 'rating', label: 'Ratings' },
        { id: 'quantity', label: 'Min Order Quantity' }
    ];

    sortOption: string = 'price-asc';
    selectedProduct: any = null;

    // API state
    loadingCategories = false;
    errorLoadingCategories = false;
    loadingProducts = false;
    errorLoadingProducts = false;
    category: any;
    productsList: any[] = [];

    // User lists
    wishlist: any[] = [];
    cart: any[] = [];

    constructor(private route: ActivatedRoute, private router: Router, private buyerApiService: BuyerApiService) {
        addIcons({ chevronBack, search, funnelOutline, swapVerticalOutline, heartOutline, cartOutline });
    }

    onSegmentChange(event: any) {
        this.selectedSegment = event.detail.value.toString(); // Ensure string conversion
    }

    toggleSearch() {
        this.isSearchActive = !this.isSearchActive;
        if (!this.isSearchActive) {
            this.searchQuery = ''; // Clear search when closing
        }
    }

    // getCategoryRegionalName(categoryId: number | null): string {
    //     if (categoryId === null) return '';
    // }

    onSearch() {
        console.log('Search Query:', this.searchQuery);
        this.applyFilters(); // Apply search filter
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.categoryId = +params['categoryId'] || -1;
            if (this.categoryId === -1) return;
            console.log('Category ID:', this.categoryId);



            // API calls with dummy data provisions
            this.fetchCategoriesByID(this.categoryId).pipe(
                switchMap((categoryData) => {
                    console.log(categoryData);
                    this.categories = categoryData!.subcategories;
                    this.category = categoryData;
                    // Get category info
            if (this.category) {
                this.categoryName = this.category.category_name;
                this.selectedCategoryId = this.category.category_id;

                // Select default "All" subcategory
                const subcategories = this.category!.subcategories;
                // const allSubcategory = subcategories.find(sub => sub.name === 'All');
                // if (allSubcategory) {
                //     this.selectSubcategory(allSubcategory.id);
                // }
            }

            this.applyFilters();
                    console.log('Category data:', this.category);
                    return this.fetchProductsByCategoryID(this.categoryId);
                })
            ).subscribe({
                next: (products: any) => {
                    this.productsList = products || []; // Handle null/undefined
                    this.selectedSubcategoryItems = this.productsList; // Update selected items
                    this.applyFilters(); // Apply filters to update display
                    console.log('Products:', this.productsList);
                },
                error: (error: any) => {
                    this.errorLoadingProducts = true;
                    this.loadingProducts = false;
                    console.error('Error in product fetch chain:', error);
                }
            });
        });
    }

    fetchCategoriesByID(categoryId: number) {
        this.loadingCategories = true;
        this.errorLoadingCategories = false;

        // Toggle this to true to use dummy data instead of API
        const useDummyData = false;

        // if (useDummyData) {
        //     // Return dummy data based on the categoryId
        //     return of(this.getDummyCategoryById(categoryId)).pipe(
        //         delay(300), // Simulate network delay
        //         tap(() => {
        //             this.loadingCategories = false;
        //         })
        //     );
        // }

        // Original API call
        return this.buyerApiService.getCategoryById(categoryId).pipe(
            tap(() => {
                this.loadingCategories = false;
            }),
            catchError((error) => {
                this.errorLoadingCategories = true;
                this.loadingCategories = false;
                console.error('Error fetching categories:', error);
                return of(null); // Fallback to dummy data on error
            })
        );
    }

    fetchProductsByCategoryID(categoryId: number) {
        this.loadingProducts = true;
        this.errorLoadingProducts = false;

        // Toggle this to true to use dummy data instead of API
        const useDummyData = false;

        if (useDummyData) {
            // Return dummy products for the category
            return of(this.getDummyProductsByCategoryId(categoryId)).pipe(
                delay(500), // Simulate network delay
                tap(() => {
                    this.loadingProducts = false;
                })
            );
        }

        // Original API call
        return this.buyerApiService.getProductsByCategoryId(categoryId).pipe(
            tap(() => {
                this.loadingProducts = false;
            }),
            catchError((error) => {
                this.errorLoadingProducts = true;
                this.loadingProducts = false;
                console.error('Error fetching products:', error);
                return of(this.getDummyProductsByCategoryId(categoryId)); // Fallback to dummy data on error
            })
        );
    }

    // Helper methods to get dummy data
    getDummyCategoryById(categoryId: number) {
        // Find the category in our local data
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            return null;
        }

        // If it's a main category, include its subcategories
        if (category.parentId === null) {
            const subcategories = this.getSubcategories(categoryId);
            return {
                ...category,
                subcategories: subcategories
            };
        }

        return category;
    }

    getDummyProductsByCategoryId(categoryId: number) {
        // For main categories (like Vegetables - ID: 1), get products from all its subcategories
        const category = this.getCategoryById(categoryId);

        if (!category) {
            return [];
        }

        // If it's a main category
        if (category.parentId === null) {
            const subcategoryIds = this.getSubcategories(categoryId).map(sub => sub.id);
            return this.products.filter(product =>
                subcategoryIds.includes(product.categoryId)
            );
        }

        // If it's an "All" subcategory
        if (category.name === 'All' && category.parentId) {
            // Get all products in sibling subcategories
            const siblingSubcategories = this.getSubcategories(category.parentId);
            const siblingSubcategoryIds = siblingSubcategories
                .filter(sub => sub.id !== category.id) // Exclude the "All" subcategory itself
                .map(sub => sub.id);

            return this.products.filter(product =>
                siblingSubcategoryIds.includes(product.categoryId)
            );
        }

        // For regular subcategories, return its products
        return this.products.filter(product => product.categoryId === categoryId);
    }

    // Category helper methods
    getCategoryById(categoryId: number) {
        return this.categories.find(category => category.id === categoryId);
    }

    getSubcategories(parentCategoryId: number) {
        return this.categories.filter(category => category.parentId === parentCategoryId);
    }

    getMainCategories() {
        return this.categories.filter(category => category.parentId === null);
    }

    // Product helper methods
    getProductsByCategoryId(categoryId: number) {
        // For "All" subcategories, we need to find all products in the parent category
        const category = this.getCategoryById(categoryId);

        if (category && category.name === 'All' && category.parentId) {
            // This is an "All" subcategory - get all products for the parent category's subcategories
            const siblingSubcategories = this.getSubcategories(category.parentId);
            const siblingSubcategoryIds = siblingSubcategories.map(sub => sub.id);
            // Filter out the "All" subcategory's own ID
            return this.products.filter(product =>
                siblingSubcategoryIds.includes(product.categoryId) && product.categoryId !== categoryId
            );
        } else {
            // Regular subcategory - get products directly assigned to it
            return this.products.filter(product => product.categoryId === categoryId);
        }
    }

    // Select a subcategory
    selectSubcategory(subcategoryId: number) {
        const subcategory = this.getCategoryById(subcategoryId);
        if (!subcategory) return;

        this.selectedSubcategoryId = subcategoryId;
        this.selectedSubcategory = subcategory.name;
        this.selectedSubcategoryItems = this.getProductsByCategoryId(subcategoryId);
        this.applyFilters();
    }

    getFilteredAndSortedItems() {
        let items = [...this.selectedSubcategoryItems];

        // Filtering logic
        if (this.filterQuery) {
            items = items.filter((item) =>
                item.name.toLowerCase().includes(this.filterQuery.toLowerCase())
            );
        }

        items = items.filter(
            (item) =>
                item.price >= this.priceRangeValues.lower &&
                item.price <= this.priceRangeValues.upper
        );

        // Apply availability filter
        if (this.availability) {
            items = items.filter((item) => item.inStock);
        }

        // Apply quantity discount filter
        if (this.quantityDiscount) {
            items = items.filter((item) => item.discount > 0);
        }

        // Apply delivery time filter
        if (this.deliveryTime !== 'any') {
            items = items.filter((item) => item.deliveryTime === this.deliveryTime);
        }

        // Apply organic filter
        if (this.organic !== null) {
            items = items.filter((item) => item.organic === this.organic);
        }

        // Apply seller ratings filter
        items = items.filter((item) => item.rating >= this.sellerRatings);

        items = items.filter((item) => item.minOrderQty >= this.minimumOrderQuantity);

        // Sorting
        switch (this.sortOption) {
            case 'price-asc':
                items.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                items.sort((a, b) => b.price - a.price);
                break;
            case 'discount':
                items.sort((a, b) => b.discount - a.discount);
                break;
            case 'rating':
                items.sort((a, b) => b.rating - a.rating);
                break;
        }

        return items;
    }

    openFilterModal() {
        if (this.filterModal) {
            this.filterModal.present();
        }
    }

    closeFilterModal() {
        if (this.filterModal) {
            this.filterModal.dismiss();
        }
    }

    // Select a filter category from the left panel
    selectFilter(filterId: string) {
        this.selectedFilter = filterId;
    }

    applyFilters() {
        console.log('Filters applied:', {
            priceRange: this.priceRangeValues,
            availability: this.availability,
            quantityDiscount: this.quantityDiscount,
            deliveryTime: this.deliveryTime,
            organic: this.organic,
            sellerRatings: this.sellerRatings,
            minimumOrderQuantity: this.minimumOrderQuantity,
        });
        this.filteredAndSortedItems = this.getFilteredAndSortedItems();
    }

    openSortModal() {
        if (this.sortModal) {
            this.sortModal.present();
        }
    }

    closeSortModal() {
        if (this.sortModal) {
            this.sortModal.dismiss();
        }
    }

    applySort() {
        this.filteredAndSortedItems = this.getFilteredAndSortedItems();
    }

    openProductModal(product: any) {
        this.selectedProduct = product;
        this.productModal?.present();
    }

    closeProductModal() {
        this.productModal?.dismiss();
    }

    // Open product details using product ID
    openProductDetails(productId: number) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.selectedProduct = product;
            this.productModal?.present();
        }
    }

    updatePriceRange(event: any) {
        this.priceRangeMin = event.detail.value.lower;
        this.priceRangeMax = event.detail.value.upper;
        this.priceRangeValues = event.detail.value;
    }

    // Wishlist and cart methods
    addToWishlist(product: any, event?: Event) {
        if (event) event.stopPropagation(); // Prevent card click from triggering modal
        if (!this.wishlist.some(item => item.id === product.id)) {
            this.wishlist.push(product);
            console.log('Added to wishlist:', product.name);
        } else {
            console.log('Already in wishlist:', product.name);
        }
    }

    addToCart(product: any, event?: Event) {
        if (event) event.stopPropagation(); // Prevent card click from triggering modal
        if (!this.cart.some(item => item.id === product.id)) {
            this.cart.push(product);
            console.log('Added to cart:', product.name);
        } else {
            console.log('Already in cart:', product.name);
        }
    }

    // Navigation methods
    goToWishlist(event?: Event) {
        if (event) event.stopPropagation(); // Prevent modal or card click
        this.router.navigate(['/wishlist']);
    }

    goToCart(event?: Event) {
        if (event) event.stopPropagation(); // Prevent modal or card click
        this.router.navigate(['/cart']);
    }

    navigateToCategory(categoryId: number) {
        this.router.navigate(['/buyer/category', categoryId]);
    }

    clearFilters() {
        this.searchQuery = ''; // Clear search query
        this.priceRangeValues = { lower: 0, upper: 150 }; // Reset price range
        this.availability = false; // Reset availability filter
        this.quantityDiscount = false; // Reset discount filter
        this.deliveryTime = 'any'; // Reset delivery time
        this.organic = null; // Reset organic filter
        this.sellerRatings = 0; // Reset seller ratings
        this.minimumOrderQuantity = 0; // Reset min order quantity

        // Reapply filters to show all items again
        this.applyFilters();
    }
}