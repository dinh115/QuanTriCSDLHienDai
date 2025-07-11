// Products API Handler - public/scripts/products.js
class ProductsManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:3001';
        this.currentPage = 1;
        this.selectedCategory = 'Best Seller';
        this.sortBy = 'popular';
        this.priceSort = '';
        this.totalPages = 1;
        this.loading = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadProducts();
    }

    bindEvents() {
        // Category selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-item__link')) {
                e.preventDefault();
                this.handleCategoryClick(e.target);
            }
        });

        // Sort buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('home-filter__btn')) {
                this.handleSortClick(e.target);
            }
        });

        // Price dropdown
        const priceDropdown = document.querySelector('.select-input');
        if (priceDropdown) {
            priceDropdown.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePriceDropdown();
            });
        }

        // Price sort options
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-input__link')) {
                e.preventDefault();
                this.handlePriceSortClick(e.target);
            }
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-item__link')) {
                e.preventDefault();
                this.handlePaginationClick(e.target);
            }
        });

        // Product like/favorite
        document.addEventListener('click', (e) => {
            if (e.target.closest('.home-product-item__like')) {
                e.preventDefault();
                this.toggleLike(e.target.closest('.home-product-item__like'));
            }
        });
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/products/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            const data = await response.json();
            const categories = ['Best Seller', ...data.categories];
            this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback categories
            this.renderCategories(['Best Seller', 'Laptop Gaming', 'Laptop Văn Phòng', 'Laptop Đồ Họa']);
        }
    }

    async loadProducts() {
        if (this.loading) return;
        
        try {
            this.loading = true;
            this.showLoading();

            const params = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: '12',
                status: 'active'
            });

            if (this.selectedCategory && this.selectedCategory !== 'Best Seller') {
                params.append('category', this.selectedCategory);
            }

            if (this.sortBy === 'newest') {
                params.append('sort', '-createdAt');
            } else if (this.sortBy === 'best-selling') {
                params.append('sort', '-reviewCount');
            } else if (this.priceSort === 'low-to-high') {
                params.append('sort', 'price');
            } else if (this.priceSort === 'high-to-low') {
                params.append('sort', '-price');
            }

            const response = await fetch(`${this.API_BASE_URL}/api/products?${params}`);
            if (!response.ok) throw new Error('Failed to fetch products');
            
            const data = await response.json();
            this.totalPages = Math.ceil((data.total || 0) / 12);
            
            this.renderProducts(data.products || []);
            this.renderPagination();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Không thể tải danh sách sản phẩm');
        } finally {
            this.loading = false;
            this.hideLoading();
        }
    }

    renderCategories(categories) {
        const categoryList = document.querySelector('.category-list');
        if (!categoryList) return;

        categoryList.innerHTML = categories.map(category => `
            <li class="category-item ${category === this.selectedCategory ? 'category-item--active' : ''}">
                <a href="#" class="category-item__link" data-category="${category}">
                    ${category}
                </a>
            </li>
        `).join('');
    }

    renderProducts(products) {
        const productContainer = document.querySelector('.home-product .row');
        if (!productContainer) return;

        if (products.length === 0) {
            productContainer.innerHTML = '<div class="col l-12"><p class="text-center">Không có sản phẩm nào</p></div>';
            return;
        }

        productContainer.innerHTML = products.map(product => `
            <div class="col l-2-4 m-4 c-6">
                <div class="home-product-item">
                    <div class="home-product-item__img" style="background-image: url(${product.image || '/static/no_cart.png'});">
                    </div>
                    <h4 class="home-product-item__name">
                        ${product.name}
                    </h4>
                    <div class="home-product-item__price">
                        <span class="home-product-item__price-current">
                            ${this.formatPrice(product.price)}đ
                        </span>
                    </div>
                    <div class="home-product-item__action">
                        <span class="home-product-item__like" data-product-id="${product.id}">
                            <i class="home-product-item__like-icon-empty fa-regular fa-heart"></i>
                            <i class="home-product-item__like-icon-fill fa-solid fa-heart"></i>
                        </span>
                        <div class="home-product-item__rating">
                            ${this.renderStars(product.rating)}
                        </div>
                        <span class="home-product-item__sold">
                            ${product.reviewCount || 0} đánh giá
                        </span>
                    </div>
                    <div class="home-product-item__origin">
                        <span class="home-product-item__brand">${product.brand || 'Shop'}</span>
                        <span class="home-product-item__origin-name">${product.category}</span>
                    </div>
                    ${product.stock > 0 ? '' : '<div class="home-product-item__out-of-stock">Hết hàng</div>'}
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push('<i class="home-product-item__star--gold fa-solid fa-star"></i>');
            } else {
                stars.push('<i class="fa-solid fa-star"></i>');
            }
        }
        return stars.join('');
    }

    renderPagination() {
        const pagination = document.querySelector('.pagination');
        if (!pagination) return;

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="pagination-item">
                <a href="#" class="pagination-item__link ${this.currentPage === 1 ? 'pagination-item__link--disabled' : ''}" 
                   data-page="${this.currentPage - 1}">
                    <i class="pagination-item__icon fa-solid fa-angle-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="pagination-item ${i === this.currentPage ? 'pagination-item--active' : ''}">
                    <a href="#" class="pagination-item__link" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < this.totalPages) {
            paginationHTML += `
                <li class="pagination-item">
                    <a href="#" class="pagination-item__link">...</a>
                </li>
                <li class="pagination-item">
                    <a href="#" class="pagination-item__link" data-page="${this.totalPages}">${this.totalPages}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="pagination-item">
                <a href="#" class="pagination-item__link ${this.currentPage === this.totalPages ? 'pagination-item__link--disabled' : ''}" 
                   data-page="${this.currentPage + 1}">
                    <i class="pagination-item__icon fa-solid fa-angle-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;

        // Update page info
        const pageInfo = document.querySelector('.home-filter__page-current');
        const totalInfo = document.querySelector('.home-filter__page-total');
        if (pageInfo) pageInfo.textContent = this.currentPage;
        if (totalInfo) totalInfo.textContent = this.totalPages;
    }

    handleCategoryClick(target) {
        const category = target.getAttribute('data-category');
        this.selectedCategory = category;
        this.currentPage = 1;
        
        // Update active state
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('category-item--active');
        });
        target.closest('.category-item').classList.add('category-item--active');
        
        this.loadProducts();
    }

    handleSortClick(target) {
        const sortType = target.textContent.trim();
        
        // Remove active state from all buttons
        document.querySelectorAll('.home-filter__btn').forEach(btn => {
            btn.classList.remove('btn--primary');
        });
        
        // Add active state to clicked button
        target.classList.add('btn--primary');
        
        if (sortType === 'Phổ biến') {
            this.sortBy = 'popular';
        } else if (sortType === 'Mới nhất') {
            this.sortBy = 'newest';
        } else if (sortType === 'Bán chạy') {
            this.sortBy = 'best-selling';
        }
        
        this.currentPage = 1;
        this.loadProducts();
    }

    handlePriceSortClick(target) {
        const sortText = target.textContent.trim();
        
        if (sortText === 'Giá: Thấp đến Cao') {
            this.priceSort = 'low-to-high';
        } else if (sortText === 'Giá: Cao đến Thấp') {
            this.priceSort = 'high-to-low';
        }
        
        // Update dropdown label
        const label = document.querySelector('.select-input__label');
        if (label) label.textContent = sortText;
        
        this.togglePriceDropdown();
        this.currentPage = 1;
        this.loadProducts();
    }

    handlePaginationClick(target) {
        const page = parseInt(target.getAttribute('data-page'));
        if (page && page !== this.currentPage && page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadProducts();
        }
    }

    toggleLike(element) {
        element.classList.toggle('home-product-item__like--liked');
        // Here you could also send API request to save like state
    }

    togglePriceDropdown() {
        const dropdown = document.querySelector('.select-input');
        if (dropdown) {
            dropdown.classList.toggle('select-input--active');
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    showLoading() {
        const productContainer = document.querySelector('.home-product .row');
        if (productContainer) {
            productContainer.innerHTML = `
                <div class="col l-12">
                    <div class="text-center" style="padding: 50px;">
                        <div class="loading-spinner">Đang tải...</div>
                    </div>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading will be hidden when products are rendered
    }

    showError(message) {
        const productContainer = document.querySelector('.home-product .row');
        if (productContainer) {
            productContainer.innerHTML = `
                <div class="col l-12">
                    <div class="text-center" style="padding: 50px; color: #f53d2d;">
                        <p>${message}</p>
                        <button onclick="productsManager.loadProducts()" class="btn btn--primary">
                            Thử lại
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});