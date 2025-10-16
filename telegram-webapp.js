exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('Получены данные from Web App:', data);
    // здесь можно проверить initData подписью, сохранить в базу и т.д.
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, received: data })
    };
  } catch (err) {
    return { statusCode: 400, body: 'Bad Request' };
  }
};