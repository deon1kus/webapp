// Конфигурация API
const API_BASE_URL = 'http://194.87.0.193:3001';

// Глобальные переменные
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all';

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Инициализация приложения
async function initApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Показываем информацию пользователя
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('userName').textContent = `${user.first_name}`;
    }

    // Загружаем данные
    await loadCategories();
    await loadProducts();
    
    // Обновляем счетчик корзины
    updateCartCount();
}

// Загрузка товаров с API
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (response.ok) {
            products = await response.json();
        } else {
            throw new Error('API недоступно');
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        // Демо-данные если API недоступно
        products = [
            {
                id: 1,
                name: "iPhone 15 Pro",
                price: 99990,
                category: "electronics",
                image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
                description: "Новый смартфон с камерой 48MP",
                stock: 10
            },
            {
                id: 2,
                name: "MacBook Air M2",
                price: 129990,
                category: "electronics",
                image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop",
                description: "Легкий и мощный ноутбук",
                stock: 5
            },
            {
                id: 3,
                name: "Футболка хлопковая",
                price: 1990,
                category: "clothing",
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop",
                description: "Комфортная повседневная футболка",
                stock: 20
            }
        ];
    }
    renderProducts(currentCategory);
}

// Загрузка категорий с API
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (response.ok) {
            categories = await response.json();
        } else {
            throw new Error('API недоступно');
        }
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        // Демо-категории если API недоступно
        categories = [
            { id: 'all', name: 'Все товары', icon: '🛒' },
            { id: 'electronics', name: 'Электроника', icon: '📱' },
            { id: 'clothing', name: 'Одежда', icon: '👕' }
        ];
    }
    renderCategories();
}

// Рендер категорий
function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat.id === currentCategory ? 'active' : ''}" 
                data-category="${cat.id}">
            ${cat.icon || ''} ${cat.name}
        </button>
    `).join('');
    
    // Добавляем обработчики событий
    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Убираем активный класс у всех кнопок
            container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            btn.classList.add('active');
            // Показываем товары выбранной категории
            currentCategory = btn.dataset.category;
            renderProducts(currentCategory);
        });
    });
}

// Рендер товаров
function renderProducts(category) {
    const container = document.getElementById('productsGrid');
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="loading">Товары не найдены</div>';
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            <img src="${product.image}" alt="${product.name}" class="product-image"
                 onerror="this.src='https://via.placeholder.com/150/2481cc/ffffff?text=📦'">
            <h3>${product.name}</h3>
            <div class="product-price">${product.price.toLocaleString()} руб.</div>
            <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
                В корзину
            </button>
        </div>
    `).join('');
}

// Показ деталей товара
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        tg.showPopup({
            title: product.name,
            message: `${product.description}\n\nЦена: ${product.price.toLocaleString()} руб.`,
            buttons: [
                { id: 'add', type: 'default', text: 'Добавить в корзину' },
                { type: 'cancel' }
            ]
        }, (btnId) => {
            if (btnId === 'add') {
                addToCart(productId);
            }
        });
    }
}

// Обновление счетчика корзины
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initApp);
