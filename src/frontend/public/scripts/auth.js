// Configuration
const API_BASE_URL = 'http://localhost:3001/api/auth';

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const closeModal = document.getElementById('closeModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const username = document.getElementById('username');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const submitLogin = document.getElementById('submitLogin');
const loginButtonText = document.getElementById('loginButtonText');
const loginSpinner = document.getElementById('loginSpinner');

// Auth State Management
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.updateUI();
        this.attachEventListeners();

        // Check if user is still authenticated on page load
        if (this.token) {
            this.validateToken();
        }
    }

    attachEventListeners() {
        // Login modal events
        loginBtn.addEventListener('click', () => this.showLoginModal());
        closeModal.addEventListener('click', () => this.hideLoginModal());
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                this.hideLoginModal();
            }
        });

        // Form submission
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Logout
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });

        // Register button (placeholder)
        registerBtn.addEventListener('click', () => {
            alert('Chức năng đăng ký sẽ được phát triển sau!');
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && loginModal.classList.contains('show')) {
                this.hideLoginModal();
            }
        });
    }

    showLoginModal() {
        loginModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.getElementById('email').focus();
    }

    hideLoginModal() {
        loginModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        this.clearMessages();
        loginForm.reset();
    }

    clearMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    setLoading(isLoading) {
        if (isLoading) {
            submitLogin.disabled = true;
            loginButtonText.style.display = 'none';
            loginSpinner.style.display = 'inline';
        } else {
            submitLogin.disabled = false;
            loginButtonText.style.display = 'inline';
            loginSpinner.style.display = 'none';
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        this.setLoading(true);
        this.clearMessages();

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (response.ok) {
                // Login successful
                this.token = data.token;
                this.user = data.user;
                // Save to localStorage
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                this.showSuccess('Đăng nhập thành công!');

                // Close modal after short delay
                setTimeout(() => {
                    this.hideLoginModal();
                    this.updateUI();
                }, 1500);

            } else {
                // Login failed
                this.showError(data.message || 'Đăng nhập thất bại');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Lỗi kết nối. Vui lòng thử lại sau.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleLogout() {
        try {
            // Optional: Call logout API
            if (this.token) {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with logout even if API fails
        }

        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');

        // Clear instance variables
        this.token = null;
        this.user = null;

        // Update UI
        this.updateUI();

        // Optional: Reload page to reset app state
        window.location.reload();
    }

    async validateToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            if (!response.ok) {
                // Token is invalid
                this.handleLogout();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            // On network error, don't logout immediately
        }
    }

    updateUI() {
        if (this.token && this.user) {
            // User is logged in
            authButtons.style.display = 'none';
            userMenu.style.display = 'block';
            username.textContent = this.user.name || this.user.email || 'Người dùng';
        } else {
            // User is not logged in
            authButtons.style.display = 'flex';
            userMenu.style.display = 'none';
        }
    }

    // Helper method to get auth headers for API calls
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    // Helper method to check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Optional: Make authManager available globally for debugging
window.authManager = authManager;

// Example of how to use authentication in other parts of your app
function makeAuthenticatedRequest(url, options = {}) {
    if (!authManager.isAuthenticated()) {
        console.warn('User not authenticated');
        return Promise.reject(new Error('User not authenticated'));
    }

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...authManager.getAuthHeaders(),
        },
    });
}

// Example usage:
// makeAuthenticatedRequest('/api/profile')
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.error(error));