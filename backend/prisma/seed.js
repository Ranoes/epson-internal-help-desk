const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users...');
  const hash = await bcrypt.hash('password123', 10);

  const users = [
    { id: 'usr_001', username: 'admin',    name: 'Admin Sistem',  role: 'admin',   department: 'IT' },
    { id: 'usr_002', username: 'manager1', name: 'Budi Santoso',  role: 'manager', department: 'Production' },
    { id: 'usr_003', username: 'user001',  name: 'Siti Rahayu',   role: 'user',    department: 'QC' },
    { id: 'usr_004', username: 'user002',  name: 'Andi Wijaya',   role: 'user',    department: 'Maintenance' },
    { id: 'usr_005', username: 'user003',  name: 'Dewi Kusuma',   role: 'user',    department: 'Assembly' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, passwordHash: hash }
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

  console.log('Seeding knowledge base (5 entries)...');
  const kbEntries = [
    {
      title: 'Garis Horizontal pada Hasil Print - Printhead Tersumbat',
      category: 'quality_printing', subcategory: 'print_defect',
      content: 'Gejala: Hasil cetak menunjukkan garis horizontal putih atau berwarna yang berulang. Penyebab: Nozzle printhead tersumbat oleh tinta kering. Langkah Penyelesaian: 1) Buka menu Settings > Maintenance pada printer ET-2400/ET-4850. 2) Pilih Print Head Cleaning dan jalankan proses standard cleaning (3-5 menit). 3) Cetak nozzle check pattern untuk verifikasi. 4) Jika masih bergaris, jalankan Power Cleaning. 5) Jika setelah 3x Power Cleaning masih bergaris, lakukan pengecekan fisik printhead.',
      tags: ['garis', 'horizontal', 'printhead', 'nozzle', 'tersumbat', 'ET-2400', 'ET-4850'],
      sourceDoc: 'Epson ET-Series Technical Manual v3.2 - Section 5.1'
    },
    {
      title: 'Error Firmware E-01 - Paper Feed Problem',
      category: 'firmware', subcategory: 'error_codes',
      content: 'Gejala: Printer menampilkan kode error E-01 dan berhenti beroperasi. Penyebab: Sensor paper feed mendeteksi kertas macet atau feed roller aus. Langkah Penyelesaian: 1) Matikan printer dan cabut kabel power. Tunggu 30 detik. 2) Buka cover belakang dan periksa kertas tersangkut. 3) Bersihkan feed roller dengan kain microfiber sedikit lembap. 4) Nyalakan kembali dan test print. 5) Jika error E-01 muncul kembali, feed roller perlu penggantian (Part No: 1533563).',
      tags: ['E-01', 'error', 'paper feed', 'roller', 'macet', 'firmware'],
      sourceDoc: 'Epson Internal Error Code Reference Book 2025 - p.12'
    },
    {
      title: 'Warna Print Tidak Akurat / Color Shift',
      category: 'quality_printing', subcategory: 'color_accuracy',
      content: 'Gejala: Warna pada hasil cetak berbeda signifikan dari tampilan layar. Penyebab: 1) Ink cartridge hampir habis. 2) Printhead alignment tidak akurat. 3) ICC profile tidak sesuai media. Langkah Penyelesaian: 1) Cek ink level dari Epson Status Monitor - pastikan semua warna di atas 20%. 2) Jalankan Print Head Alignment dari menu Maintenance. 3) Pastikan paper type di driver sesuai jenis kertas. 4) Untuk produksi batch, gunakan media yang sudah di-approve QC.',
      tags: ['warna', 'color', 'shift', 'tidak akurat', 'ICC', 'alignment'],
      sourceDoc: 'SOP QC Color Management Rev.4'
    },
    {
      title: 'Printer Tidak Terdeteksi di Jaringan / Network Discovery Failed',
      category: 'hardware', subcategory: 'connectivity',
      content: 'Gejala: Printer tidak muncul di daftar printer padahal sudah terhubung LAN. Penyebab: IP address konflik, DHCP lease expired, atau NIC printer hang. Langkah Penyelesaian: 1) Cetak halaman Network Status dari panel printer. Catat IP address. 2) Pastikan printer dan komputer di subnet yang sama (192.168.1.x). 3) Ping IP printer dari komputer (cmd: ping 192.168.1.105). 4) Jika tidak merespons, reset network: Settings > Restore Default Settings > Network Settings Only. 5) Assign IP statis untuk printer produksi - koordinasi dengan tim IT.',
      tags: ['network', 'jaringan', 'tidak terdeteksi', 'LAN', 'IP', 'DHCP'],
      sourceDoc: 'Panduan Konfigurasi Jaringan Printer Epson - IT SOP v2.1'
    },
    {
      title: 'Firmware Update Gagal - Printer Brick / Tidak Bisa Boot',
      category: 'firmware', subcategory: 'firmware_update',
      content: 'PERINGATAN: Kondisi kritis. Jangan matikan printer. Gejala: Proses update firmware terhenti akibat mati listrik atau koneksi terputus. Printer tidak dapat boot normal. Langkah Penyelesaian: 1) JANGAN cabut power printer. 2) Hubungi supervisor IT SEGERA. 3) Sambungkan printer langsung ke komputer via USB. 4) Download Epson Firmware Recovery Tool dari repository internal IT (\\fileserver\\tools\\epson\\recovery). 5) Jalankan recovery tool sebagai administrator. 6) Proses recovery 15-30 menit, jangan interupsi. 7) Jika recovery gagal, buat tiket ke IT Support.',
      tags: ['firmware', 'update', 'gagal', 'brick', 'recovery', 'boot', 'kritis'],
      sourceDoc: 'Prosedur Emergency Firmware Recovery - IT-2026'
    }
  ];

  for (const kb of kbEntries) {
    await prisma.knowledgeBase.create({ data: kb });
  }
  console.log('Knowledge base seeded.');

  console.log('\nSeed complete! Credentials: username/password123 for all users.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());