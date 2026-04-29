# 🎯 Quick Reference - QR Code API Endpoints

## Base URL
```
http://localhost:3000/api/scan
```

---

## Endpoints Barang QR Code

### 1️⃣ Get All QR Codes
```
GET /barang/qrcode
```
**Description:** Dapatkan semua QR codes untuk semua barang dalam format JSON  
**Auth:** Tidak diperlukan  
**Query Params:**
- `base_url` (optional): Custom frontend URL untuk QR code

**Response:**
```json
{
  "message": "QR Code semua barang",
  "total": 10,
  "data": [...]
}
```

---

### 2️⃣ Get QR Code Image (Preview)
```
GET /barang/qrcode/:id
```
**Description:** Tampilkan QR code barang sebagai gambar PNG  
**Auth:** Tidak diperlukan  
**Params:**
- `id`: Barang ID

**Response:** PNG Image (400x400px)

---

### 3️⃣ Download QR Code (Print Quality)
```
GET /barang/qrcode/download/:id
```
**Description:** Download QR code dalam resolusi tinggi untuk cetak  
**Auth:** Tidak diperlukan  
**Params:**
- `id`: Barang ID

**Response:** PNG File (800x800px) - Download dengan nama `qr-barang-{kode_barang}.png`

---

### 4️⃣ Get Barang Detail
```
GET /barang/detail/:id
```
**Description:** Dapatkan detail lengkap barang ketika di-scan  
**Auth:** Tidak diperlukan  
**Params:**
- `id`: Barang ID

**Response:**
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
    "keterangan": "...",
    "image": "...",
    "ruangan": {...},
    "kategori": {...},
    "cabang": {...},
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

## cURL Examples

### Get All QR Codes
```bash
curl -X GET "http://localhost:3000/api/scan/barang/qrcode"
```

### Get Single QR Code (Display)
```bash
curl -X GET "http://localhost:3000/api/scan/barang/qrcode/1" \
  -H "Accept: image/png" -o qr-preview.png
```

### Download QR Code
```bash
curl -X GET "http://localhost:3000/api/scan/barang/qrcode/download/1" \
  -o qr-barang-BRG001.png
```

### Get Detail Barang
```bash
curl -X GET "http://localhost:3000/api/scan/barang/detail/1" \
  -H "Accept: application/json"
```

---

## JavaScript/Fetch Examples

### Get All QR Codes
```javascript
fetch('/api/scan/barang/qrcode')
  .then(res => res.json())
  .then(data => console.log(data.data))
```

### Display QR Code Image
```javascript
const img = document.createElement('img');
img.src = '/api/scan/barang/qrcode/1';
document.body.appendChild(img);
```

### Download QR Code
```javascript
const link = document.createElement('a');
link.href = '/api/scan/barang/qrcode/download/1';
link.click();
```

### Get Barang Detail
```javascript
fetch('/api/scan/barang/detail/1')
  .then(res => res.json())
  .then(data => {
    console.log('Nama:', data.data.name);
    console.log('Stok:', data.data.jumlah);
    console.log('Kategori:', data.data.kategori.name_kategori);
  })
```

---

## QR Code Content

QR code berisi URL yang mengarah ke:
```
{baseUrl}/barang/scan?id={barangId}
```

Contoh:
```
http://localhost:5173/barang/scan?id=1
```

Ketika di-scan, frontend akan:
1. Parse parameter `id` dari URL
2. Panggil `GET /api/scan/barang/detail/{id}`
3. Tampilkan detail barang

---

## Spesifikasi Teknis

| Properti | Nilai |
|----------|-------|
| Format | PNG |
| Warna Foreground | #1A73E8 (Biru) |
| Warna Background | #FFFFFF (Putih) |
| Error Correction | H (30%) |
| Size Preview | 400x400px |
| Size Download | 800x800px |
| Margin | 2-3px |

---

## Error Responses

### 404 Not Found
```json
{
  "message": "Barang tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "error details..."
}
```

---

## Files Modified

1. `src/controllers/scanController.js` - Added 4 new functions
2. `src/routes/scanRoutes.js` - Added 4 new routes

---

## Status

✅ Implementation Complete - Ready to Use!
