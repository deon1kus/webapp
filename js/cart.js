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
                <div>${item.price.toLocaleString()} руб. × ${item.quantity}</div>
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
    totalElement.textContent = total.toLocaleString();
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
        const orderData = {
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: total,
            userId: tg.initDataUnsafe?.user?.id,
            userData: tg.initDataUnsafe?.user
        };

        // Отправка заказа на API
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const result = await response.json();
            tg.showAlert(`✅ Заказ #${result.order.id} оформлен! Скоро с вами свяжутся.`);
            
            // Очищаем корзину
            cart = [];
            saveCart();
            updateCartCount();
            closeCart();
        } else {
            const error = await response.json();
            tg.showAlert(`❌ Ошибка: ${error.error}`);
        }
        
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
        tg.showAlert('❌ Ошибка при оформлении заказа');
    }
}
