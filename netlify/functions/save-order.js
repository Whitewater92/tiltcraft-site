const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let order;
  try {
    order = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'Whitewater92/tiltcraft-site';
  const path = 'orders.json';

  // Get current orders file
  let currentOrders = [];
  let sha = null;

  try {
    const getResult = await githubGet(token, repo, path);
    const decoded = Buffer.from(getResult.content, 'base64').toString('utf-8');
    currentOrders = JSON.parse(decoded);
    sha = getResult.sha;
  } catch (e) {
    // File doesn't exist yet, start fresh
  }

  // Add new order with timestamp
  order.savedAt = new Date().toISOString();
  currentOrders.unshift(order);

  // Keep max 500 orders
  if (currentOrders.length > 500) currentOrders = currentOrders.slice(0, 500);

  // Save back to GitHub
  const content = Buffer.from(JSON.stringify(currentOrders, null, 2)).toString('base64');
  const payload = {
    message: `Order ${order.ref}`,
    content,
    ...(sha ? { sha } : {})
  };

  try {
    await githubPut(token, repo, path, payload);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

function githubGet(token, repo, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${path}`,
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'TiltCraft' }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(data));
        else reject(new Error(`${res.statusCode}: ${data}`));
      });
    }).on('error', reject);
  });
}

function githubPut(token, repo, path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${path}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'TiltCraft',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) resolve(JSON.parse(data));
        else reject(new Error(`${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
