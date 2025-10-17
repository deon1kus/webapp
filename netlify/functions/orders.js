const { validateTelegramData } = require('./auth');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify Telegram user
    const authResult = await validateTelegramData(event);
    if (!authResult.valid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    if (event.httpMethod === 'POST') {
      const orderData = JSON.parse(event.body);
      
      // Validate order data
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid order data' })
        };
      }

      // Calculate total and validate stock
      let total = 0;
      for (const item of orderData.items) {
        const product = await getProduct(item.id);
        if (!product || product.stock < item.quantity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: `Product ${item.name} is out of stock` })
          };
        }
        total += product.price * item.quantity;
      }

      const order = {
        id: Date.now(),
        ...orderData,
        total,
        status: 'new',
        createdAt: new Date().toISOString(),
        user: extractUserData(event) // Extract user from Telegram data
      };

      // Save order (in production, save to database)
      const orders = JSON.parse(process.env.ORDERS || '[]');
      orders.push(order);
      // In production: save to database

      // Update product stock (in production)
      for (const item of orderData.items) {
        await updateProductStock(item.id, -item.quantity);
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          success: true, 
          order,
          message: 'Order created successfully' 
        })
      };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  } catch (error) {
    console.error('Order error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Mock functions - replace with database calls
async function getProduct(id) {
  const products = JSON.parse(process.env.PRODUCTS || '[]');
  return products.find(p => p.id === id);
}

async function updateProductStock(id, quantity) {
  // In production, update in database
  console.log(`Updating product ${id} stock by ${quantity}`);
}

function extractUserData(event) {
  const authData = event.headers['x-telegram-auth'];
  const data = new URLSearchParams(authData);
  
  return {
    id: data.get('id'),
    first_name: data.get('first_name'),
    username: data.get('username'),
    language_code: data.get('language_code')
  };
}
