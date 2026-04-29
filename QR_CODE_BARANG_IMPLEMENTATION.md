# 📱 Implementasi QR Code untuk Barang

## ✅ Status: SELESAI

Fitur QR Code untuk barang telah berhasil diimplementasikan. Setiap barang kini dapat memiliki QR Code yang dapat didownload dan di-scan untuk menampilkan detail barang secara lengkap.

---

## 🚀 Fitur yang Tersedia

### 1. **Generate QR Code untuk Satu Barang**
```
GET /api/scan/barang/qrcode/:id
```
- Menampilkan QR code sebagai gambar PNG inline
- Resolusi: 400x400px (untuk preview)
- Warna: Biru (#1A73E8) dengan latar putih
- QR code berisi URL: `{baseUrl}/barang/scan?id={id}`

**Contoh Request:**
```bash
curl http://localhost:3000/api/scan/barang/qrcode/1
```

**Response:** PNG Image

---

### 2. **Download QR Code Barang**
```
GET /api/scan/barang/qrcode/download/:id
```
- Mendownload QR code dalam resolusi tinggi untuk cetak/label
- Resolusi: 800x800px (untuk cetak di atas barang fisik)
- File akan otomatis didownload dengan nama: `qr-barang-{kode_barang}.png`

**Contoh Request:**
```bash
curl http://localhost:3000/api/scan/barang/qrcode/download/1 -o qr-code.png
```

---

### 3. **Dapatkan Semua QR Codes Barang**
```
GET /api/scan/barang/qrcode
```
- Menampilkan QR code untuk semua barang dalam format JSON
- Setiap item berisi data lengkap barang + QR code dalam format Base64

**Response Example:**
```json
{
  "message": "QR Code semua barang",
  "total": 10,
  "data": [
    {
      "id": 1,
      "kode_barang": "BRG001",
      "name": "Kursi Kantor",
      "kategori": {
        "id": 1,
        "name_kategori": "Furniture"
      },
      "ruangan": {
        "id": 1,
        "name_ruangan": "Ruang Kepala"
      },
      "cabang": {
        "id": 1,
        "name_cabang": "Pusat"
      },
      "jumlah": 5,
      "qr_url": "http://localhost:5173/barang/scan?id=1",
      "qr_base64": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    },
    // ... barang lainnya
  ]
}
```

---

### 4. **Scan QR Code dan Lihat Detail Barang**
```
GET /api/scan/barang/detail/:id
```
- Menampilkan detail lengkap barang ketika di-scan
- Mencakup semua informasi: kategori, ruangan, cabang, stok, dll

**Response Example:**
```json
{
  "message": "Detail Barang",
  "data": {
    "id": 1,
    "kode_barang": "BRG001",
    "name": "Kursi Kantor",
    "satuan": "buah",
    "jumlah": 5,
    "tahun_pengadaan": 2023,
    "keterangan": "Kursi ergonomis merah",
    "image": "image_url.jpg",
    "ruangan": {
      "id": 1,
      "name_ruangan": "Ruang Kepala",
      "kode_ruangan": "RG001"
    },
    "kategori": {
      "id": 1,
      "name_kategori": "Furniture"
    },
    "cabang": {
      "id": 1,
      "name_cabang": "Pusat"
    },
    "created_at": "2023-01-15T10:30:00.000Z",
    "updated_at": "2023-01-15T10:30:00.000Z"
  }
}
```

---

## 🔄 Alur Penggunaan Lengkap

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GENERATE QR CODE                                         │
│    GET /api/scan/barang/qrcode/:id                          │
│    └─> Tampilkan QR code di aplikasi                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DOWNLOAD QR CODE (OPSIONAL)                              │
│    GET /api/scan/barang/qrcode/download/:id                 │
│    └─> Unduh untuk dicetak dan ditempel di barang fisik     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SCAN QR CODE DENGAN SMARTPHONE                           │
│    QR code dibuka → {baseUrl}/barang/scan?id={id}           │
│    └─> Frontend akan memanggil API detail barang            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. TAMPILKAN DETAIL BARANG                                  │
│    GET /api/scan/barang/detail/:id                          │
│    └─> Tampilkan informasi lengkap barang (stok, kategori,  │
│        lokasi, kondisi, dll)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 File yang Dimodifikasi

### 1. **src/controllers/scanController.js**
Ditambahkan 4 fungsi baru:
- `getDetailBarang()` - Ambil detail barang
- `getQRCodeBarang()` - Generate QR code barang
- `downloadQRCodeBarang()` - Download QR code barang
- `getAllQRCodesBarang()` - Ambil semua QR codes

### 2. **src/routes/scanRoutes.js**
Ditambahkan 4 route baru:
```javascript
router.get('/barang/qrcode', scanController.getAllQRCodesBarang);
router.get('/barang/qrcode/download/:id', scanController.downloadQRCodeBarang);
router.get('/barang/qrcode/:id', scanController.getQRCodeBarang);
router.get('/barang/detail/:id', scanController.getDetailBarang);
```

---

## 🔧 Konfigurasi

### Environment Variable (Optional)
Jika ingin mengubah base URL untuk QR code:

**.env**
```
FRONTEND_URL=http://localhost:5173
```

Atau pass melalui query parameter:
```
GET /api/scan/barang/qrcode/1?base_url=http://yourdomain.com
```

---

## 💡 Contoh Implementasi di Frontend

### React/Vue - Menampilkan Semua QR Codes
```javascript
async function getAllQRCodes() {
  const response = await fetch('/api/scan/barang/qrcode');
  const data = await response.json();
  
  data.data.forEach(barang => {
    // Tampilkan barang.qr_base64 sebagai gambar
    console.log(`QR Code untuk ${barang.name}:`);
    console.log(barang.qr_base64);
  });
}
```

### React/Vue - Download QR Code
```javascript
function downloadQRCode(barangId) {
  const link = document.createElement('a');
  link.href = `/api/scan/barang/qrcode/download/${barangId}`;
  link.download = `qr-barang-${barangId}.png`;
  link.click();
}
```

### React/Vue - Tampilkan Detail Barang Saat Scan
```javascript
async function getBarangDetail(barangId) {
  const response = await fetch(`/api/scan/barang/detail/${barangId}`);
  const data = await response.json();
  
  console.log('Detail Barang:');
  console.log(`Nama: ${data.data.name}`);
  console.log(`Stok: ${data.data.jumlah}`);
  console.log(`Kategori: ${data.data.kategori.name_kategori}`);
  console.log(`Ruangan: ${data.data.ruangan.name_ruangan}`);
  console.log(`Cabang: ${data.data.cabang.name_cabang}`);
}
```

---

## 🎨 Spesifikasi QR Code

| Aspek | Spesifikasi |
|-------|-------------|
| Format | PNG |
| Warna Gelap | #1A73E8 (Biru) |
| Warna Terang | #FFFFFF (Putih) |
| Error Correction | H (High - 30% recovery) |
| Resolusi Preview | 400x400px |
| Resolusi Download | 800x800px |
| Margin | 2-3px |
| Content | URL: `{baseUrl}/barang/scan?id={id}` |

---

## ❌ Error Handling

### Barang Tidak Ditemukan
```json
{
  "message": "Barang tidak ditemukan"
}
```
Status Code: **404**

### Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error details..."
}
```
Status Code: **500**

---

## 📦 Dependencies

Sudah tersedia di project:
- **qrcode**: v1.5.4 - Untuk generate QR code

---

## 🚨 Catatan Penting

1. **QR Code URL Format**: QR code berisi URL lengkap ke endpoint frontend, bukan backend. Pastikan `baseUrl` atau `FRONTEND_URL` sudah benar.

2. **Authentication**: Route scan tidak memerlukan authentication (authMiddleware tidak aktif pada scanRoutes), sehingga QR code dapat di-scan tanpa login.

3. **Relasi Data**: API menampilkan relasi dengan kategori, ruangan, dan cabang. Pastikan data-data ini tersedia di database.

4. **Caching**: Untuk performa lebih baik di frontend, pertimbangkan untuk cache QR code Base64.

---

## 🔍 Testing dengan cURL

```bash
# 1. Dapatkan semua QR codes
curl http://localhost:3000/api/scan/barang/qrcode

# 2. Download QR code barang dengan id 1
curl http://localhost:3000/api/scan/barang/qrcode/download/1 -o qr-code-1.png

# 3. Tampilkan QR code barang (inline)
curl http://localhost:3000/api/scan/barang/qrcode/1

# 4. Dapatkan detail barang dengan id 1
curl http://localhost:3000/api/scan/barang/detail/1
```

---

## ✨ Kesimpulan

Fitur QR Code untuk barang kini telah siap digunakan! Anda dapat:
- ✅ Generate QR code untuk setiap barang
- ✅ Download QR code dalam resolusi tinggi untuk cetak
- ✅ Scan QR code dan tampilkan detail barang lengkap
- ✅ Kelola semua QR codes barang di satu tempat

Selamat menggunakan! 🎉
