const { validateTelegramData } = require('./auth');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify Telegram authentication for sensitive operations
    if (event.httpMethod !== 'GET') {
      const authResult = await validateTelegramData(event);
      if (!authResult.valid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }
    }

    const path = event.path.split('/').filter(Boolean);
    const resource = path[2]; // products, categories, orders
    
    switch (event.httpMethod) {
      case 'GET':
        return handleGetRequest(resource, event.queryStringParameters);
      case 'POST':
        return handlePostRequest(resource, JSON.parse(event.body));
      case 'PUT':
        return handlePutRequest(resource, path[3], JSON.parse(event.body));
      case 'DELETE':
        return handleDeleteRequest(resource, path[3]);
      default:
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};

// Mock database - in production use real database
let products = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    price: 99990,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
    description: "Новый смартфон с камерой 48MP",
    stock: 10,
    createdAt: new Date().toISOString()
  }
];

let orders = [];
let categories = [
  { id: 'electronics', name: 'Электроника', icon: '📱' },
  { id: 'clothing', name: 'Одежда', icon: '👕' }
];

async function handleGetRequest(resource, query) {
  switch (resource) {
    case 'products':
      const category = query?.category;
      const filteredProducts = category && category !== 'all' 
        ? products.filter(p => p.category === category)
        : products;
      return { statusCode: 200, body: JSON.stringify(filteredProducts) };
    
    case 'categories':
      return { statusCode: 200, body: JSON.stringify(categories) };
    
    case 'orders':
      // In production, filter orders by user ID
      return { statusCode: 200, body: JSON.stringify(orders) };
    
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) };
  }
}

async function handlePostRequest(resource, data) {
  switch (resource) {
    case 'products':
      const newProduct = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString()
      };
      products.push(newProduct);
      return { statusCode: 201, body: JSON.stringify(newProduct) };
    
    case 'orders':
      const newOrder = {
        id: Date.now(),
        ...data,
        status: 'new',
        createdAt: new Date().toISOString()
      };
      orders.push(newOrder);
      
      // Update product stock
      data.items.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
          product.stock -= item.quantity;
        }
      });
      
      return { statusCode: 201, body: JSON.stringify(newOrder) };
    
    case 'categories':
      const newCategory = {
        id: data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...data
      };
      categories.push(newCategory);
      return { statusCode: 201, body: JSON.stringify(newCategory) };
    
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) };
  }
}

async function handlePutRequest(resource, id, data) {
  const numericId = parseInt(id);
  
  switch (resource) {
    case 'products':
      const productIndex = products.findIndex(p => p.id === numericId);
      if (productIndex === -1) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
      }
      products[productIndex] = { ...products[productIndex], ...data };
      return { statusCode: 200, body: JSON.stringify(products[productIndex]) };
    
    case 'orders':
      const orderIndex = orders.findIndex(o => o.id === numericId);
      if (orderIndex === -1) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
      }
      orders[orderIndex] = { ...orders[orderIndex], ...data };
      return { statusCode: 200, body: JSON.stringify(orders[orderIndex]) };
    
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) };
  }
}

async function handleDeleteRequest(resource, id) {
  const numericId = parseInt(id);
  
  switch (resource) {
    case 'products':
      products = products.filter(p => p.id !== numericId);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    
    case 'orders':
      orders = orders.filter(o => o.id !== numericId);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) };
  }
}
