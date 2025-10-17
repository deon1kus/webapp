// Добавление в корзину
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    tg.showAlert('Товар добавлен в корзину!');
}

// Сохранение корзины
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Обновление счетчика корзины
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

// Открытие корзины
document.getElementById('cartBtn').addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'block';
    renderCart();
});

// Закрытие корзины
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

// Рендер корзины
function renderCart() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('totalPrice');
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Корзина пуста</p>';
        totalElement.textContent = '0';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <strong>${item.name}</strong>
                <div>${item.price} руб. × ${item.quantity}</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                <button onclick="removeFromCart(${item.id})" style="margin-left: 10px; color: red;">🗑️</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalElement.textContent = total;
}

// Изменение количества
function changeQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartCount();
            renderCart();
        }
    }
}

// Удаление из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
}

// Оформление заказа
async function checkout() {
    if (cart.length === 0) {
        tg.showAlert('Корзина пуста!');
        return;
    }

    try {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Здесь будет интеграция с платежной системой
        tg.showConfirm(`Оформить заказ на сумму ${total} руб.?`, (confirmed) => {
            if (confirmed) {
                // Временная логика - позже добавим реальное оформление
                tg.showAlert('Заказ оформлен! Скоро с вами свяжутся.');
                cart = [];
                saveCart();
                updateCartCount();
                closeCart();
            }
        });
        
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        tg.showAlert('Ошибка при оформлении заказа');
    }
}
