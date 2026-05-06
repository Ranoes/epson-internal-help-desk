# Knowledge Base – Epson Internal Help Desk

Direktori ini berisi file SOP (Standard Operating Procedure) manufaktur sintetik Epson yang digunakan oleh AI Engine (Clawbot) sebagai referensi saat menjawab pertanyaan karyawan.

## Struktur

```
knowledge-base/
├── sop/                   # File SOP dalam format Markdown
│   ├── SOP-001-...md
│   ├── SOP-002-...md
│   └── ...
└── templates/             # Template untuk membuat SOP baru
    └── sop-template.md
```

## Cara Menambahkan SOP Baru

1. Salin template dari `templates/sop-template.md`
2. Isi semua bagian yang diperlukan
3. Simpan file di direktori `sop/` dengan nama format: `SOP-XXX-nama-singkat.md`
4. Restart AI Engine agar file baru diindeks otomatis

## Konvensi Penamaan

| Prefix | Kategori |
|--------|----------|
| SOP-001 hingga SOP-099 | Proses Produksi |
| SOP-100 hingga SOP-199 | Kualitas & QC |
| SOP-200 hingga SOP-299 | Keselamatan & K3 |
| SOP-300 hingga SOP-399 | Pemeliharaan Mesin |
| SOP-400 hingga SOP-499 | IT & Sistem |
