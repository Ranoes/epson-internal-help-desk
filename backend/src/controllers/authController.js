const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) { next(err); }
}

async function register(req, res, next) {
  try {
    const { username, email, password, name, department, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already taken' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}`;

    const user = await prisma.user.create({
      data: {
        id: userId,
        username,
        email: email || null,
        passwordHash,
        name,
        department,
        role: role || 'user'
      }
    });

    res.status(201).json({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role } 
    });
  } catch (err) { next(err); }
}

module.exports = { login, register };
