require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { errorHandler } = require('./middlewares/errorHandler');
const { globalLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Security headers
app.use(helmet());

// CORS - whitelist intranet
const allowedOrigins = (process.env.INTRANET_WHITELIST || '').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman / server-to-server
    const ok = allowedOrigins.some(ip => origin.includes(ip));
    ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing (10mb untuk imageBase64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use(globalLimiter);

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/chat',      require('./routes/chat'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/tickets',   require('./routes/tickets'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// Global error handler (harus paling bawah)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

module.exports = app;