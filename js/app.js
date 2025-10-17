// Конфигурация API
const API_BASE_URL = 'http://194.87.0.193:3001';

// Глобальные переменные
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cyber-cart')) || [];
let currentCategory = 'all';
let isAdmin = false;

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Инициализация приложения
async function initApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    tg.setHeaderColor('#00f3ff');
    tg.setBackgroundColor('#0a0a0a');
    
    // Проверяем админские права
    checkAdminRights();
    
    // Показываем информацию пользователя
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('userName').textContent = `@${user.username || user.first_name}`;
    }

    // Загружаем данные
    await loadCategories();
    await loadProducts();
    
    // Обновляем счетчик корзины
    updateCartCount();
    setupMainButton();
}

// Проверка прав администратора
function checkAdminRights() {
    const adminIds = ['291867873']; // Ваш ID
    const user = tg.initDataUnsafe.user;
    
    if (user && adminIds.includes(user.id.toString())) {
        isAdmin = true;
        showAdminPanel();
    }
}

// Показать панель администратора
function showAdminPanel() {
    const header = document.querySelector('.header');
    const adminBtn = document.createElement('button');
    adminBtn.className = 'cyber-button';
    adminBtn.innerHTML = '⚡ АДМИН';
    adminBtn.onclick = showAdminModal;
    
    header.appendChild(adminBtn);
}

// Модальное окно администратора
function showAdminModal() {
    tg.showPopup({
        title: '⚙️ ПАНЕЛЬ УПРАВЛЕНИЯ',
        message: 'Выберите действие:',
        buttons: [
            { id: 'add_product', type: 'default', text: '➕ Добавить товар' },
            { id: 'view_orders', type: 'default', text: '📊 Просмотр заказов' },
            { id: 'stats', type: 'default', text: '📈 Статистика' },
            { type: 'cancel' }
        ]
    }, async (buttonId) => {
        switch (buttonId) {
            case 'add_product':
                showAddProductForm();
                break;
            case 'view_orders':
                await showOrdersList();
                break;
            case 'stats':
                showStats();
                break;
        }
    });
}

// Форма добавления товара
function showAddProductForm() {
    tg.showPopup({
        title: '➕ ДОБАВИТЬ ТОВАР',
        message: 'Введите данные товара:',
        buttons: [
            { id: 'submit', type: 'default', text: '✅ Сохранить' },
            { type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId === 'submit') {
            // Здесь будет форма ввода
            addProductViaForm();
        }
    });
}

// Загрузка товаров с API
async function loadProducts() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (response.ok) {
            products = await response.json();
        } else {
            throw new Error('API недоступно');
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        // Демо-данные если API недоступно
        products = getDemoProducts();
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
        categories = getDemoCategories();
    }
    renderCategories();
}

// Рендер категорий
function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat.id === currentCategory ? 'active' : ''}" 
                onclick="selectCategory('${cat.id}')">
            ${cat.icon || ''} ${cat.name}
        </button>
    `).join('');
}

// Выбор категории
function selectCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderProducts(currentCategory);
}

// Рендер товаров
function renderProducts(category) {
    const container = document.getElementById('productsGrid');
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div>ТОВАРЫ НЕ НАЙДЕНЫ</div>
                <div style="font-size: 12px; margin-top: 10px;">Попробуйте другую категорию</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            ${product.stock < 5 ? `<div class="stock-badge">${product.stock} LEFT</div>` : ''}
            <img src="${product.image}" alt="${product.name}" class="product-image"
                 onerror="this.src='https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150&h=150&fit=crop&auto=format'">
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-price">${formatPrice(product.price)} ₿</div>
            <button class="cyber-button" onclick="event.stopPropagation(); addToCart(${product.id})" 
                    style="width: 100%; margin-top: 5px;" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'OUT OF STOCK' : 'ADD TO CART'}
            </button>
        </div>
    `).join('');
}

// Показ деталей товара
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        tg.showPopup({
            title: `📀 ${product.name}`,
            message: `
${product.description}

💾 Цена: ${formatPrice(product.price)} ₿
🖥️ В наличии: ${product.stock} шт.
${product.stock < 3 ? '\n⚠️ Заканчивается!' : ''}
            `.trim(),
            buttons: [
                { id: 'add', type: 'default', text: '🛒 Добавить в корзину' },
                isAdmin ? { id: 'edit', type: 'default', text: '⚙️ Редактировать' } : null,
                { type: 'cancel' }
            ].filter(Boolean)
        }, (btnId) => {
            if (btnId === 'add') {
                addToCart(productId);
            } else if (btnId === 'edit') {
                editProduct(productId);
            }
        });
    }
}

// Форматирование цены
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Показать загрузку
function showLoading() {
    const container = document.getElementById('productsGrid');
    container.innerHTML = `
        <div class="loading">
            <div>ЗАГРУЗКА ДАННЫХ</div>
            <div style="font-size: 12px; margin-top: 10px;">ПОДКЛЮЧЕНИЕ К СЕРВЕРУ...</div>
        </div>
    `;
}

// Демо-данные
function getDemoProducts() {
    return [
        {
            id: 1,
            name: "CYBER DECK X1",
            price: 29990,
            category: "electronics",
            image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
            description: "Мощный кибердеск для хакерских операций",
            stock: 3
        },
        {
            id: 2,
            name: "NEURAL LINK",
            price: 15990,
            category: "electronics",
            image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=300&fit=crop",
            description: "Интерфейс мозг-компьютер последнего поколения",
            stock: 7
        },
        {
            id: 3,
            name: "SYNTHETIC JACKET",
            price: 4990,
            category: "clothing",
            image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop",
            description: "Защитный костюм с неоновой подсветкой",
            stock: 12
        }
    ];
}

function getDemoCategories() {
    return [
        { id: 'all', name: 'ВСЕ ТОВАРЫ', icon: '🖥️' },
        { id: 'electronics', name: 'ЭЛЕКТРОНИКА', icon: '⚡' },
        { id: 'clothing', name: 'ОДЕЖДА', icon: '👕' },
        { id: 'cyberware', name: 'КИБЕРНЕТИКА', icon: '🔧' }
    ];
}

// Настройка MainButton
function setupMainButton() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (totalItems > 0) {
        tg.MainButton.setText(`🛒 КОРЗИНА: ${formatPrice(totalPrice)} ₿`);
        tg.MainButton.show();
        tg.MainButton.onClick(showCart);
    } else {
        tg.MainButton.hide();
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initApp);
