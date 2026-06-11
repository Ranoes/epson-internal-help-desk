const { readSettings, writeSettings, normalizeProvider } = require('../services/runtimeSettings');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAiSettings(req, res, next) {
  try {
    const settings = await readSettings();
    res.json({
      success: true,
      settings: {
        aiProvider: settings.aiProvider,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateAiSettings(req, res, next) {
  try {
    const aiProvider = normalizeProvider(req.body.aiProvider || req.body.provider);
    const settings = await writeSettings({ aiProvider });
    res.json({
      success: true,
      message: 'AI provider updated',
      settings: {
        aiProvider: settings.aiProvider,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        department: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        fullname: u.name || u.username,
        username: u.username,
        email: u.email || 'N/A',
        department: u.department || 'N/A',
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { userId } = req.params;
    
    // Delete related records first
    await prisma.chatLog.deleteMany({ where: { userId } });
    await prisma.ticket.deleteMany({ where: { userId } });
    
    // Delete user
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAiSettings, updateAiSettings, getUsers, deleteUser };