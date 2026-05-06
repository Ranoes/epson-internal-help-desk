# SOP-002 – Pengujian Kualitas Tinta (In-Process & Final)

**Nomor SOP:** SOP-002  
**Versi:** 1.0  
**Tanggal Berlaku:** 2024-02-01  
**Departemen:** Quality Control  
**Dibuat Oleh:** Tim QC  
**Disetujui Oleh:** Manajer QC  

---

## 1. Tujuan

Menetapkan prosedur standar untuk pengujian kualitas tinta sintetik Epson pada tahap in-process (selama produksi) maupun pengujian final sebelum produk dilepas ke pasar.

## 2. Ruang Lingkup

Mencakup semua jenis tinta yang diproduksi di fasilitas manufaktur Epson: tinta pigmen, tinta dye-based, dan tinta UV-curable.

## 3. Referensi

- SOP-001 – Proses Pencampuran Tinta Sintetik
- Spesifikasi Produk Tinta Epson (PSL-INK-2024)
- ISO 11664 – Colorimetry
- ASTM D1475 – Density of Liquid Coatings

## 4. Definisi & Singkatan

| Istilah | Definisi |
|---------|----------|
| OD | Optical Density – kepadatan optik |
| cP | Centipoise – satuan viskositas |
| dE | Delta E – perbedaan warna yang dapat diukur |
| CoA | Certificate of Analysis – sertifikat analisis |
| AQL | Acceptance Quality Level |

## 5. Alat & Bahan

- Viskometer Brookfield (spindle LV-1 hingga LV-4)
- pH meter digital (akurasi ±0,01)
- Densitometer / piknometer
- Spectrophotometer (untuk uji warna)
- Kertas uji standar Epson
- Printer referensi (untuk uji cetak)
- Mikroskop optik (untuk uji partikel)

## 6. Prosedur

### 6.1 Pengujian In-Process (setelah fase dispersi)

1. Ambil sampel 100 mL dari tangki menggunakan wadah bersih yang telah diberi label batch ID.
2. **Uji Viskositas:**
   - Kondisikan sampel pada suhu 25°C ± 0,5°C selama 10 menit.
   - Gunakan viskometer Brookfield dengan spindle yang sesuai.
   - Putar selama 60 detik dan catat hasilnya.
   - Spesifikasi: **8–12 cP** (tinta pigmen) / **3–7 cP** (tinta dye).
3. **Uji pH:**
   - Masukkan elektroda pH meter ke dalam sampel.
   - Catat nilai pH setelah stabil.
   - Spesifikasi: **7,5–8,5**.
4. **Uji Densitas:**
   - Gunakan piknometer yang telah dikalibrasi.
   - Catat nilai densitas dalam g/mL.
   - Spesifikasi: sesuai PSL-INK-2024 per tipe tinta.

### 6.2 Pengujian Final (sebelum pengemasan)

1. Ambil sampel dari tangki penyimpanan setelah penyaringan.
2. Ulangi semua pengujian in-process (viskositas, pH, densitas).
3. **Uji Warna (Colorimetry):**
   - Cetak pola uji standar menggunakan printer referensi.
   - Ukur nilai L*, a*, b* dengan spectrophotometer.
   - Hitung dE terhadap standar warna referensi.
   - Spesifikasi: **dE ≤ 2,0** (acceptable), **dE ≤ 1,0** (premium).
4. **Uji Stabilitas (Uji Penyimpanan Dipercepat):**
   - Simpan sampel 50 mL pada suhu 50°C selama 7 hari.
   - Setelah 7 hari, ulang semua pengujian di atas.
   - Semua parameter harus tetap dalam spesifikasi.
5. **Uji Cetak Fungsional:**
   - Isi kartrid printer referensi dengan tinta yang diuji.
   - Cetak pattern nozzle check dan pastikan semua nozzle berfungsi.
   - Cetak halaman uji gambar berwarna dan evaluasi secara visual.

### 6.3 Keputusan Release

| Hasil | Tindakan |
|-------|----------|
| Semua parameter PASS | Beri label "RELEASED – QC APPROVED" |
| 1 parameter FAIL | Investigasi penyebab, lakukan re-test |
| ≥ 2 parameter FAIL | Batch ditolak, kembalikan ke produksi untuk review |

## 7. Tindakan Darurat

- Jika ditemukan kontaminasi mikrobiologis, segera karantina batch dan laporkan ke QC Manager.
- Jangan melepas batch yang belum mendapatkan persetujuan QC dalam bentuk apapun.

## 8. Rekaman & Dokumentasi

- Lembar Pengujian In-Process (FR-QC-005)
- Lembar Pengujian Final (FR-QC-010)
- Certificate of Analysis (CoA) diterbitkan untuk setiap batch yang di-release.

## 9. Riwayat Revisi

| Versi | Tanggal | Deskripsi Perubahan | Diubah Oleh |
|-------|---------|---------------------|-------------|
| 1.0   | 2024-02-01 | Versi awal | Tim QC |
