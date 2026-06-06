const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const manufacturingKbPath = path.resolve(__dirname, '../../ai-engine/data/knowledge_base_manufacturing.json');

async function main() {
  console.log('Seeding users...');
  const hash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('adminpass123', 10);

  const users = [
    { id: 'usr_001', username: 'admin',    name: 'Admin Sistem',   role: 'admin',   department: 'IT', passwordHash: hash },
    { id: 'usr_006', username: 'admin001', name: 'Global Admin', role: 'admin',   department: 'IT', passwordHash: adminHash },
    { id: 'usr_002', username: 'manager1', name: 'Budi Santoso',   role: 'manager', department: 'Production', passwordHash: hash },
    { id: 'usr_003', username: 'user001',  name: 'Siti Rahayu',   role: 'user',    department: 'QC', passwordHash: hash },
    { id: 'usr_004', username: 'user002',  name: 'Andi Wijaya',   role: 'user',    department: 'Maintenance', passwordHash: hash },
    { id: 'usr_005', username: 'user003',  name: 'Dewi Kusuma',   role: 'user',    department: 'Assembly', passwordHash: hash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        username: u.username,
        role: u.role,
        passwordHash: u.passwordHash
      },
      create: u
    });
  }
  console.log('Users seeded.');

  console.log('Seeding tickets...');
  const tickets = [
    { id: 'tkt_00001', userId: 'usr_003', question: 'Printer ET-2400 garis horizontal pada hasil print',     status: 'resolved',    resolution: 'Printhead cleaning berhasil mengatasi masalah', assignedTo: 'usr_001' },
    { id: 'tkt_00002', userId: 'usr_004', question: 'Error E-01 terus muncul setelah feed roller dibersihkan', status: 'in_progress', assignedTo: 'usr_001', resolution: null },
    { id: 'tkt_00003', userId: 'usr_005', question: 'Warna print tidak akurat pada batch produksi pagi',     status: 'open',        assignedTo: null,       resolution: null },
    { id: 'tkt_00004', userId: 'usr_003', question: 'Printer tidak terdeteksi di jaringan lantai 2',         status: 'open',        assignedTo: null,       resolution: null },
    { id: 'tkt_00005', userId: 'usr_004', question: 'Firmware update gagal, printer tidak bisa boot',        status: 'in_progress', assignedTo: 'usr_001', resolution: null },
  ];

  for (const t of tickets) {
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, sessionId: null }
    });
  }
  console.log('Tickets seeded.');

  console.log('Cleaning knowledge base table...');
  await prisma.knowledgeBase.deleteMany();

  console.log('Seeding knowledge base from manufacturing source...');
  const kbSeed = JSON.parse(fs.readFileSync(manufacturingKbPath, 'utf-8'));
  for (const kb of kbSeed.knowledge_base || []) {
    await prisma.knowledgeBase.upsert({
      where: { id: kb.id },
      update: {
        title: kb.title,
        category: kb.category,
        subcategory: kb.subcategory || null,
        content: kb.content,
        tags: kb.tags || [],
        sourceDoc: kb.source_doc || null,
      },
      create: {
        id: kb.id,
        title: kb.title,
        category: kb.category,
        subcategory: kb.subcategory || null,
        content: kb.content,
        tags: kb.tags || [],
        sourceDoc: kb.source_doc || null,
      }
    });
  }
  console.log(`Knowledge base seeded from ${manufacturingKbPath}.`);

  console.log('\nSeed complete! Credentials: username/password123 for all users.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());