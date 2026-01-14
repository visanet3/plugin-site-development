import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const generateToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};

const escapeSQL = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
};

const SCHEMA = 't_p32599880_plugin_site_developm';

// AUTH ENDPOINTS

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, referral_code } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  try {
    const client = await pool.connect();
    const passwordHash = hashPassword(password);

    // Check existing user
    const existing = await client.query(
      `SELECT id FROM ${SCHEMA}.users WHERE username = $1 OR email = $2`,
      [username, email]
    );

    if (existing.rows.length > 0) {
      client.release();
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    // Create user
    const result = await client.query(
      `INSERT INTO ${SCHEMA}.users (username, email, password_hash, referred_by_code) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, avatar_url, role, forum_role, balance, created_at`,
      [username, email, passwordHash, referral_code || null]
    );

    const user = result.rows[0];
    const token = generateToken();

    client.release();

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  try {
    const client = await pool.connect();
    const passwordHash = hashPassword(password);

    const result = await client.query(
      `SELECT id, username, email, avatar_url, role, forum_role, balance, created_at, is_blocked 
       FROM ${SCHEMA}.users 
       WHERE username = $1 AND password_hash = $2`,
      [username, passwordHash]
    );

    if (result.rows.length === 0) {
      client.release();
      return res.status(401).json({ error: 'Неверные данные' });
    }

    const user = result.rows[0];

    if (user.is_blocked) {
      client.release();
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }

    const token = generateToken();
    client.release();

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Get user
app.get('/api/auth/user', async (req, res) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT id, username, email, avatar_url, role, forum_role, balance, created_at, vip_until, is_verified 
       FROM ${SCHEMA}.users 
       WHERE id = $1`,
      [userId]
    );

    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
});

// CRYPTO ENDPOINTS

// Get crypto balances
app.post('/api/crypto/balances', async (req, res) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT 
        COALESCE(btc_balance, 0) as btc_balance,
        COALESCE(eth_balance, 0) as eth_balance,
        COALESCE(bnb_balance, 0) as bnb_balance,
        COALESCE(sol_balance, 0) as sol_balance,
        COALESCE(xrp_balance, 0) as xrp_balance,
        COALESCE(trx_balance, 0) as trx_balance
       FROM ${SCHEMA}.users 
       WHERE id = $1`,
      [userId]
    );

    client.release();

    const data = result.rows[0] || {};

    res.json({
      success: true,
      balances: {
        BTC: parseFloat(data.btc_balance || 0),
        ETH: parseFloat(data.eth_balance || 0),
        BNB: parseFloat(data.bnb_balance || 0),
        SOL: parseFloat(data.sol_balance || 0),
        XRP: parseFloat(data.xrp_balance || 0),
        TRX: parseFloat(data.trx_balance || 0)
      }
    });
  } catch (error) {
    console.error('Get balances error:', error);
    res.status(500).json({ error: 'Ошибка получения балансов' });
  }
});

// Exchange USDT to Crypto
app.post('/api/crypto/exchange-usdt-to-crypto', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { usdt_amount, crypto_symbol, crypto_price } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (!usdt_amount || !crypto_symbol || !crypto_price) {
    return res.status(400).json({ success: false, error: 'Некорректные параметры' });
  }

  const validCryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX'];
  if (!validCryptos.includes(crypto_symbol.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Неподдерживаемая криптовалюта' });
  }

  try {
    const client = await pool.connect();

    // Check balance
    const balanceResult = await client.query(
      `SELECT balance FROM ${SCHEMA}.users WHERE id = $1`,
      [userId]
    );

    if (balanceResult.rows.length === 0 || balanceResult.rows[0].balance < usdt_amount) {
      client.release();
      return res.status(400).json({ success: false, error: 'Недостаточно средств' });
    }

    const cryptoAmount = usdt_amount / crypto_price;
    const cryptoColumn = `${crypto_symbol.toLowerCase()}_balance`;

    // Update balances
    await client.query(
      `UPDATE ${SCHEMA}.users 
       SET balance = balance - $1, 
           ${cryptoColumn} = COALESCE(${cryptoColumn}, 0) + $2 
       WHERE id = $3`,
      [usdt_amount, cryptoAmount, userId]
    );

    // Insert transaction
    await client.query(
      `INSERT INTO ${SCHEMA}.transactions (user_id, amount, type, description) 
       VALUES ($1, $2, 'exchange', $3)`,
      [userId, -usdt_amount, `Обмен ${usdt_amount} USDT на ${cryptoAmount} ${crypto_symbol}`]
    );

    // Insert crypto transaction
    await client.query(
      `INSERT INTO ${SCHEMA}.crypto_transactions 
       (user_id, transaction_type, crypto_symbol, amount, price, total, status) 
       VALUES ($1, 'buy', $2, $3, $4, $5, 'completed')`,
      [userId, crypto_symbol, cryptoAmount, crypto_price, usdt_amount]
    );

    client.release();

    res.json({
      success: true,
      crypto_received: cryptoAmount
    });
  } catch (error) {
    console.error('Exchange error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обмена' });
  }
});

// Exchange Crypto to USDT
app.post('/api/crypto/exchange-crypto-to-usdt', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { crypto_amount, crypto_symbol, crypto_price } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (!crypto_amount || !crypto_symbol || !crypto_price) {
    return res.status(400).json({ success: false, error: 'Некорректные параметры' });
  }

  const validCryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX'];
  if (!validCryptos.includes(crypto_symbol.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Неподдерживаемая криптовалюта' });
  }

  try {
    const client = await pool.connect();
    const cryptoColumn = `${crypto_symbol.toLowerCase()}_balance`;

    // Check crypto balance
    const balanceResult = await client.query(
      `SELECT ${cryptoColumn} FROM ${SCHEMA}.users WHERE id = $1`,
      [userId]
    );

    if (balanceResult.rows.length === 0 || (balanceResult.rows[0][cryptoColumn] || 0) < crypto_amount) {
      client.release();
      return res.status(400).json({ success: false, error: 'Недостаточно средств' });
    }

    const usdtAmount = crypto_amount * crypto_price;

    // Update balances
    await client.query(
      `UPDATE ${SCHEMA}.users 
       SET balance = balance + $1, 
           ${cryptoColumn} = COALESCE(${cryptoColumn}, 0) - $2 
       WHERE id = $3`,
      [usdtAmount, crypto_amount, userId]
    );

    // Insert transaction
    await client.query(
      `INSERT INTO ${SCHEMA}.transactions (user_id, amount, type, description) 
       VALUES ($1, $2, 'exchange', $3)`,
      [userId, usdtAmount, `Обмен ${crypto_amount} ${crypto_symbol} на ${usdtAmount} USDT`]
    );

    // Insert crypto transaction
    await client.query(
      `INSERT INTO ${SCHEMA}.crypto_transactions 
       (user_id, transaction_type, crypto_symbol, amount, price, total, status) 
       VALUES ($1, 'sell', $2, $3, $4, $5, 'completed')`,
      [userId, crypto_symbol, crypto_amount, crypto_price, usdtAmount]
    );

    client.release();

    res.json({
      success: true,
      usdt_received: usdtAmount
    });
  } catch (error) {
    console.error('Exchange error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обмена' });
  }
});

// Withdraw Crypto
app.post('/api/crypto/withdraw', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { crypto_symbol, amount, address } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  if (!crypto_symbol || !amount || !address) {
    return res.status(400).json({ success: false, error: 'Некорректные параметры' });
  }

  const validCryptos = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX'];
  if (!validCryptos.includes(crypto_symbol.toUpperCase())) {
    return res.status(400).json({ success: false, error: 'Неподдерживаемая криптовалюта' });
  }

  try {
    const client = await pool.connect();
    const cryptoColumn = `${crypto_symbol.toLowerCase()}_balance`;

    // Check balance
    const balanceResult = await client.query(
      `SELECT ${cryptoColumn} FROM ${SCHEMA}.users WHERE id = $1`,
      [userId]
    );

    if (balanceResult.rows.length === 0 || (balanceResult.rows[0][cryptoColumn] || 0) < amount) {
      client.release();
      return res.status(400).json({ success: false, error: 'Недостаточно средств' });
    }

    // Update balance
    await client.query(
      `UPDATE ${SCHEMA}.users 
       SET ${cryptoColumn} = COALESCE(${cryptoColumn}, 0) - $1 
       WHERE id = $2`,
      [amount, userId]
    );

    // Create withdrawal request
    await client.query(
      `INSERT INTO ${SCHEMA}.withdrawals 
       (user_id, crypto_symbol, amount, address, status, created_at) 
       VALUES ($1, $2, $3, $4, 'pending', NOW())`,
      [userId, crypto_symbol.toUpperCase(), amount, address]
    );

    // Get price for crypto_transactions
    const priceResult = await client.query(
      `SELECT price FROM ${SCHEMA}.crypto_transactions 
       WHERE crypto_symbol = $1 
       ORDER BY created_at DESC LIMIT 1`,
      [crypto_symbol]
    );

    const currentPrice = priceResult.rows[0]?.price || 0;

    // Insert crypto transaction
    await client.query(
      `INSERT INTO ${SCHEMA}.crypto_transactions 
       (user_id, transaction_type, crypto_symbol, amount, price, total, status, wallet_address) 
       VALUES ($1, 'withdraw', $2, $3, $4, $5, 'pending', $6)`,
      [userId, crypto_symbol, amount, currentPrice, amount * currentPrice, address]
    );

    client.release();

    res.json({ success: true });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, error: 'Ошибка вывода' });
  }
});

// Get crypto transactions
app.post('/api/crypto/transactions', async (req, res) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT id, transaction_type, crypto_symbol, amount, price, total, status, wallet_address, created_at 
       FROM ${SCHEMA}.crypto_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId]
    );

    client.release();

    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Ошибка получения транзакций' });
  }
});

// CRYPTO PRICES ENDPOINT
app.get('/api/crypto/prices', async (req, res) => {
  try {
    // Fetch real prices from Binance
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'TRXUSDT'];
    const prices = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
          const data = await response.json();
          return { symbol, price: parseFloat(data.price) };
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err);
          return { symbol, price: 0 };
        }
      })
    );

    const buyPrices = {};
    const sellPrices = {};

    prices.forEach(({ symbol, price }) => {
      const crypto = symbol.replace('USDT', '');
      const buyMarkup = 1.02; // +2% for buy
      const sellMarkdown = 0.98; // -2% for sell

      buyPrices[crypto] = price * buyMarkup;
      sellPrices[crypto] = price * sellMarkdown;
    });

    res.json({
      success: true,
      buy_prices: buyPrices,
      sell_prices: sellPrices
    });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ error: 'Ошибка получения курсов' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
