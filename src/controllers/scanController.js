const Ruangan   = require("../models/ruanganModels");
const Barang    = require("../models/barangModels");
const Cabang    = require("../models/cabangModels");
const Kategori  = require("../models/kategoriModels");
const { generatePDF } = require("../services/exportPdf");
const QRCode    = require("qrcode");

const formatTanggal = (tgl) =>
    tgl ? new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

exports.getDetailRuangan = async (req, res) => {
    try {
        const { id } = req.params;

        const ruangan = await Ruangan.findByPk(id);
        if (!ruangan) return res.status(404).json({ message: "Ruangan tidak ditemukan" });

        const barangList = await Barang.findAll({
            where: { ruangan_id: id },
            include: [
                { model: Cabang,  as: "cabang",  attributes: ["id", "name_cabang"], required: false },
                { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan", "kode_ruangan"], required: false },
            ],
        });

        const totalStok = barangList.reduce((sum, b) => sum + (b.jumlah || 0), 0);

        return res.status(200).json({
            message: "Detail Ruangan",
            ruangan: {
                id:           ruangan.id,
                kode_ruangan: ruangan.kode_ruangan,
                name_ruangan: ruangan.name_ruangan,
            },
            total_jenis_barang: barangList.length,
            total_stok:         totalStok,
            barang: barangList.map((b) => b.toJSON()),
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.getQRCodeRuangan = async (req, res) => {
    try {
        const { id }  = req.params;
        const baseUrl = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";

        const ruangan = await Ruangan.findByPk(id);
        if (!ruangan) return res.status(404).json({ message: "Ruangan tidak ditemukan" });

        const targetUrl = `${baseUrl}/ruangan/scan?id=${id}`;
        const qrBuffer  = await QRCode.toBuffer(targetUrl, {
            type:  "png",
            width: 400,
            margin: 2,
            color: { dark: "#1A73E8", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
        });

        res.set({
            "Content-Type":        "image/png",
            "Content-Disposition": `inline; filename="qr-${ruangan.kode_ruangan}.png"`,
            "Content-Length":      qrBuffer.length,
        });

        return res.send(qrBuffer);

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.downloadQRCodeRuangan = async (req, res) => {
    try {
        const { id }  = req.params;
        const baseUrl = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";

        const ruangan = await Ruangan.findByPk(id);
        if (!ruangan) return res.status(404).json({ message: "Ruangan tidak ditemukan" });

        const targetUrl = `${baseUrl}/ruangan/scan?id=${id}`;

        // Resolusi tinggi untuk kebutuhan cetak/tempel di pintu
        const qrBuffer  = await QRCode.toBuffer(targetUrl, {
            type:  "png",
            width: 800,
            margin: 3,
            color: { dark: "#1A73E8", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
        });

        res.set({
            "Content-Type":        "image/png",
            "Content-Disposition": `attachment; filename="qr-ruangan-${ruangan.kode_ruangan}.png"`,
            "Content-Length":      qrBuffer.length,
        });

        return res.send(qrBuffer);

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.getAllQRCodes = async (req, res) => {
    try {
        const baseUrl     = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";
        const ruanganList = await Ruangan.findAll({ order: [["kode_ruangan", "ASC"]] });

        const result = await Promise.all(
            ruanganList.map(async (r) => {
                const targetUrl = `${baseUrl}/ruangan/scan?id=${r.id}`;
                const qrBase64  = await QRCode.toDataURL(targetUrl, {
                    width: 300,
                    margin: 2,
                    color: { dark: "#1A73E8", light: "#FFFFFF" },
                    errorCorrectionLevel: "H",
                });
                return {
                    id:           r.id,
                    kode_ruangan: r.kode_ruangan,
                    name_ruangan: r.name_ruangan,
                    qr_url:       targetUrl,
                    qr_base64:    qrBase64,
                };
            })
        );

        return res.status(200).json({
            message: "QR Code semua ruangan",
            total:   result.length,
            data:    result,
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.exportPDFDetailRuangan = async (req, res) => {
    try {
        const { id }  = req.params;
        const baseUrl = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";

        const ruangan = await Ruangan.findByPk(id);
        if (!ruangan) return res.status(404).json({ message: "Ruangan tidak ditemukan" });

        const barangList = await Barang.findAll({
            where: { ruangan_id: id },
            include: [
                { model: Cabang,  as: "cabang",  attributes: ["id", "name_cabang"], required: false },
                { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan", "kode_ruangan"], required: false },
            ],
        });

        const totalStok = barangList.reduce((sum, b) => sum + (b.jumlah || 0), 0);

        // QR base64 disisipkan langsung ke dalam HTML PDF
        const targetUrl = `${baseUrl}/ruangan/scan?id=${id}`;
        const qrBase64  = await QRCode.toDataURL(targetUrl, {
            width: 200,
            margin: 2,
            color: { dark: "#1A73E8", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
        });

        const kondisiMap = {
            baik:   `<span class="badge-baik">Baik</span>`,
            sedang: `<span class="badge-sedang">Sedang</span>`,
            rusak:  `<span class="badge-rusak">Rusak</span>`,
        };

        const tableRows = barangList.map((b, index) => {
            const d            = b.toJSON();
            const kondisiBadge = kondisiMap[d.kondisi?.toLowerCase()] ?? `<span class="badge-baik">${d.kondisi ?? "-"}</span>`;

            return `
                <tr>
                    <td class="center">${index + 1}</td>
                    <td class="center"><span class="badge-kode">${d.kode_barang ?? "-"}</span></td>
                    <td>${d.name ?? "-"}</td>
                    <td class="center">${d.jumlah ?? 0}</td>
                    <td class="center">${d.satuan ?? "-"}</td>
                    <td class="center">${kondisiBadge}</td>
                    <td class="center">${formatTanggal(d.createdAt)}</td>
                </tr>
            `;
        }).join("");

        const pdfData = {
            printDate:        new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }),
            kodeRuangan:      ruangan.kode_ruangan,
            namaRuangan:      ruangan.name_ruangan,
            totalJenisBarang: barangList.length,
            totalStok,
            qrBase64,
            tableRows,
        };

        const pdfBuffer = await generatePDF("detailRuangan.html", pdfData);

        res.set({
            "Content-Type":        "application/pdf",
            "Content-Disposition": `attachment; filename="inventaris-${ruangan.kode_ruangan}.pdf"`,
            "Content-Length":      pdfBuffer.length,
        });

        return res.send(pdfBuffer);

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// ========== BARANG QR CODE FUNCTIONS ==========

exports.getDetailBarang = async (req, res) => {
    try {
        const { id } = req.params;

        const barang = await Barang.findByPk(id, {
            include: [
                { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan", "kode_ruangan"], required: false },
                { model: Kategori, as: "kategori", attributes: ["id", "name_kategori"], required: false },
                { model: Cabang, as: "cabang", attributes: ["id", "name_cabang"], required: false },
            ],
        });

        if (!barang) {
            return res.status(404).json({ message: "Barang tidak ditemukan" });
        }

        return res.status(200).json({
            message: "Detail Barang",
            data: barang.toJSON(),
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.getQRCodeBarang = async (req, res) => {
    try {
        const { id } = req.params;
        const baseUrl = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";

        const barang = await Barang.findByPk(id);
        if (!barang) return res.status(404).json({ message: "Barang tidak ditemukan" });

        const targetUrl = `${baseUrl}/barang/scan?id=${id}`;
        const qrBuffer = await QRCode.toBuffer(targetUrl, {
            type: "png",
            width: 400,
            margin: 2,
            color: { dark: "#1A73E8", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
        });

        res.set({
            "Content-Type": "image/png",
            "Content-Disposition": `inline; filename="qr-${barang.kode_barang}.png"`,
            "Content-Length": qrBuffer.length,
        });

        return res.send(qrBuffer);

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.downloadQRCodeBarang = async (req, res) => {
    try {
        const { id } = req.params;
        const baseUrl = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";

        const barang = await Barang.findByPk(id);
        if (!barang) return res.status(404).json({ message: "Barang tidak ditemukan" });

        const targetUrl = `${baseUrl}/barang/scan?id=${id}`;

        const qrBuffer = await QRCode.toBuffer(targetUrl, {
            type: "png",
            width: 800,
            margin: 3,
            color: { dark: "#1A73E8", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
        });

        res.set({
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="qr-barang-${barang.kode_barang}.png"`,
            "Content-Length": qrBuffer.length,
        });

        return res.send(qrBuffer);

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.getAllQRCodesBarang = async (req, res) => {
    try {
        const baseUrl = req.query.base_url || process.env.FRONTEND_URL || "http://localhost:5173";
        
        const barangList = await Barang.findAll({
            order: [["kode_barang", "ASC"]],
            include: [
                { model: Kategori, as: "kategori", attributes: ["id", "name_kategori"], required: false },
                { model: Ruangan, as: "ruangan", attributes: ["id", "name_ruangan"], required: false },
                { model: Cabang, as: "cabang", attributes: ["id", "name_cabang"], required: false },
            ],
        });

        const result = await Promise.all(
            barangList.map(async (b) => {
                const targetUrl = `${baseUrl}/barang/scan?id=${b.id}`;
                const qrBase64 = await QRCode.toDataURL(targetUrl, {
                    width: 300,
                    margin: 2,
                    color: { dark: "#1A73E8", light: "#FFFFFF" },
                    errorCorrectionLevel: "H",
                });
                const barangData = b.toJSON();
                return {
                    id: barangData.id,
                    kode_barang: barangData.kode_barang,
                    name: barangData.name,
                    kategori: barangData.kategori,
                    ruangan: barangData.ruangan,
                    cabang: barangData.cabang,
                    jumlah: barangData.jumlah,
                    qr_url: targetUrl,
                    qr_base64: qrBase64,
                };
            })
        );

        return res.status(200).json({
            message: "QR Code semua barang",
            total: result.length,
            data: result,
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};