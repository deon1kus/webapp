// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Инициализация приложения
async function initApp() {
    // Показываем информацию пользователя
    if (tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('userName').textContent = `${user.first_name}`;
    }

    // Загружаем товары и категории
    await loadCategories();
    await loadProducts();
    
    // Обновляем счетчик корзины
    updateCartCount();
}

// Загрузка категорий
async function loadCategories() {
    try {
        // Временные данные - позже заменим на API
        categories = [
            { id: 'all', name: 'Все товары' },
            { id: 'electronics', name: 'Электроника' },
            { id: 'clothing', name: 'Одежда' },
            { id: 'books', name: 'Книги' }
        ];
        
        renderCategories();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

// Загрузка товаров
async function loadProducts() {
    try {
        // Временные данные - позже заменим на API
        products = [
            {
                id: 1,
                name: 'Смартфон',
                price: 29990,
                category: 'electronics',
                image: 'https://via.placeholder.com/150?text=Phone',
                description: 'Новый смартфон с отличной камерой'
            },
            {
                id: 2,
                name: 'Футболка',
                price: 1990,
                category: 'clothing', 
                image: 'https://via.placeholder.com/150?text=T-Shirt',
                description: 'Хлопковая футболка'
            },
            {
                id: 3,
                name: 'Книга',
                price: 890,
                category: 'books',
                image: 'https://via.placeholder.com/150?text=Book',
                description: 'Интересная книга'
            }
        ];
        
        renderProducts('all');
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
    }
}

// Рендер категорий
function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = categories.map(cat => `
        <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" 
                data-category="${cat.id}">
            ${cat.name}
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
            renderProducts(btn.dataset.category);
        });
    });
}

// Рендер товаров
function renderProducts(category) {
    const container = document.getElementById('productsGrid');
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(p => p.category === category);
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <h3>${product.name}</h3>
            <div class="product-price">${product.price} руб.</div>
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
            message: `${product.description}\n\nЦена: ${product.price} руб.`,
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initApp);
