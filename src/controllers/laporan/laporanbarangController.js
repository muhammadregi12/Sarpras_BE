const Barang   = require("../../models/barangModels");
const Ruangan  = require("../../models/ruanganModels");
const Kategori = require("../../models/kategoriModels");
const Cabang   = require("../../models/cabangModels");
const { generatePDF } = require("../../services/exportPdf");
const ExcelJS  = require("exceljs");
const { Op }   = require("sequelize");

async function resolveLokasiInfo({ cabang_id, ruangan_id }) {
    let infoCabang  = null;
    let infoRuangan = null;

    if (cabang_id) {
        infoCabang = await Cabang.findByPk(cabang_id, {
            attributes: ["id", "name_cabang", "daerah_cabang"]
        });
        if (!infoCabang) throw { status: 404, message: "Cabang tidak ditemukan" };
    }

    if (ruangan_id) {
        infoRuangan = await Ruangan.findByPk(ruangan_id, {
            attributes: ["id", "name_ruangan"]
        });
        if (!infoRuangan) throw { status: 404, message: "Ruangan tidak ditemukan" };
    }

    return { infoCabang, infoRuangan };
}

async function fetchBarang({ cabang_id, ruangan_id }) {
    const whereBarang = {};
    
    // Filter langsung di tabel barang
    if (ruangan_id) whereBarang.ruangan_id = ruangan_id;
    if (cabang_id)  whereBarang.cabang_id  = cabang_id; // ← langsung di barang

    return await Barang.findAll({
        where: whereBarang,
        attributes: ["id", "name", "kode_barang", "jumlah", "satuan", "keterangan", "tahun_pengadaan"],
        include: [
            {
                model: Ruangan,
                as: "ruangan",
                attributes: ["id", "name_ruangan"],
            },
            {
                model: Kategori,
                as: "kategori",
                attributes: ["id", "name_kategori"]
            }
        ],
        order: [["kode_barang", "ASC"]]
    });
}

exports.getLaporanBarang = async (req, res) => {
    try {
        const { cabang_id, ruangan_id } = req.query;

        if (!cabang_id && !ruangan_id) {
            return res.status(400).json({
                message: "Minimal salah satu filter harus diisi: cabang_id atau ruangan_id"
            });
        }

        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });
        const barangs = await fetchBarang({ cabang_id, ruangan_id });

        const labelFilter = [
            infoCabang  ? `Cabang: ${infoCabang.name_cabang}`    : null,
            infoRuangan ? `Ruangan: ${infoRuangan.name_ruangan}` : null,
        ].filter(Boolean).join(" | ");

        return res.status(200).json({
            message: `Laporan Barang - ${labelFilter}`,
            filter: {
                cabang:  infoCabang  ? { id: infoCabang.id,  name: infoCabang.name_cabang }   : null,
                ruangan: infoRuangan ? { id: infoRuangan.id, name: infoRuangan.name_ruangan } : null,
            },
            total_data:   barangs.length,
            total_jumlah: barangs.reduce((sum, b) => sum + (b.jumlah ?? 0), 0),
            data: barangs.map(b => b.toJSON())
        });

    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.exportPDFLaporanBarang = async (req, res) => {
    try {
        const { cabang_id, ruangan_id } = req.query;

        if (!cabang_id && !ruangan_id) {
            return res.status(400).json({
                message: "Minimal salah satu filter harus diisi: cabang_id atau ruangan_id"
            });
        }

        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });
        const barangs = await fetchBarang({ cabang_id, ruangan_id });

        const labelFilter = [
            infoCabang  ? infoCabang.name_cabang    : null,
            infoRuangan ? infoRuangan.name_ruangan  : null,
        ].filter(Boolean).join(" - ");

        const tableRows = barangs.map((item, index) => {
            const b = item.toJSON();
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="badge">${b.kode_barang}</span></td>
                    <td>${b.name}</td>
                    <td>${b.kategori?.name_kategori ?? "-"}</td>
                    <td>${b.ruangan?.name_ruangan   ?? "-"}</td>
                    <td>${b.jumlah ?? 0}</td>
                    <td>${b.satuan ?? "-"}</td>
                    <td>${b.tahun_pengadaan}</td>
                    <td>${b.keterangan ?? "-"}</td>
                </tr>
            `;
        }).join("");

        const pdfData = {
            printDate:   new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }),
            labelFilter,
            totalBarang: barangs.length,
            totalJumlah: barangs.reduce((sum, b) => sum + (b.jumlah ?? 0), 0),
            // Info detail untuk header PDF
            infoCabang:  infoCabang  ? `${infoCabang.name_cabang} (${infoCabang.daerah_cabang ?? "-"})` : "Semua Cabang",
            infoRuangan: infoRuangan ? infoRuangan.name_ruangan : "Semua Ruangan",
            tableRows,
        };

        const pdfBuffer = await generatePDF("laporanBarang.html", pdfData);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="laporan-barang-${labelFilter.replace(/ /g, "-")}.pdf"`,
            "Content-Length": pdfBuffer.length,
        });

        return res.send(pdfBuffer);

    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

exports.exportExcelLaporanBarang = async (req, res) => {
    try {
        const { cabang_id, ruangan_id } = req.query;

        if (!cabang_id && !ruangan_id) {
            return res.status(400).json({
                message: "Minimal salah satu filter harus diisi: cabang_id atau ruangan_id"
            });
        }

        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });
        const barangs = await fetchBarang({ cabang_id, ruangan_id });

        const labelFilter = [
            infoCabang  ? infoCabang.name_cabang    : null,
            infoRuangan ? infoRuangan.name_ruangan  : null,
        ].filter(Boolean).join(" - ");

        const totalJumlah = barangs.reduce((s, b) => s + (b.jumlah ?? 0), 0);

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Laporan Barang");

        const headerStyle = {
            font:      { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
            fill:      { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A73E8" } },
            alignment: { horizontal: "center", vertical: "middle" },
            border: {
                top:    { style: "thin", color: { argb: "FFB0C4DE" } },
                bottom: { style: "thin", color: { argb: "FFB0C4DE" } },
                left:   { style: "thin", color: { argb: "FFB0C4DE" } },
                right:  { style: "thin", color: { argb: "FFB0C4DE" } },
            }
        };

        const rowBorder = {
            top:    { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left:   { style: "thin", color: { argb: "FFE0E0E0" } },
            right:  { style: "thin", color: { argb: "FFE0E0E0" } },
        };

        // Judul
        worksheet.mergeCells("A1:I1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value     = "LAPORAN DATA BARANG";
        titleCell.font      = { bold: true, size: 14, color: { argb: "FF1A73E8" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // Info cabang
        worksheet.mergeCells("A2:I2");
        const cabangCell = worksheet.getCell("A2");
        cabangCell.value     = `Cabang: ${infoCabang ? `${infoCabang.name_cabang} (${infoCabang.daerah_cabang ?? "-"})` : "Semua Cabang"}`;
        cabangCell.font      = { bold: true, size: 11, color: { argb: "FF333333" } };
        cabangCell.alignment = { horizontal: "center" };
        worksheet.getRow(2).height = 20;

        // Info ruangan
        worksheet.mergeCells("A3:I3");
        const ruanganCell = worksheet.getCell("A3");
        ruanganCell.value     = `Ruangan: ${infoRuangan ? infoRuangan.name_ruangan : "Semua Ruangan"}`;
        ruanganCell.font      = { size: 11, color: { argb: "FF333333" } };
        ruanganCell.alignment = { horizontal: "center" };
        worksheet.getRow(3).height = 20;

        // Tanggal cetak
        worksheet.mergeCells("A4:I4");
        const dateCell = worksheet.getCell("A4");
        dateCell.value     = `Dicetak pada: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`;
        dateCell.font      = { italic: true, size: 10, color: { argb: "FF888888" } };
        dateCell.alignment = { horizontal: "center" };
        worksheet.getRow(4).height = 18;

        // Baris kosong
        worksheet.addRow([]);

        // Header kolom (baris ke-6)
        const headerRow = worksheet.addRow([
            "No", "Kode Barang", "Nama Barang", "Kategori",
            "Ruangan", "Jumlah", "Satuan", "Tahun Pengadaan", "Keterangan"
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font      = headerStyle.font;
            cell.fill      = headerStyle.fill;
            cell.alignment = headerStyle.alignment;
            cell.border    = headerStyle.border;
        });

        worksheet.columns = [
            { key: "no",              width: 5  },
            { key: "kode_barang",     width: 15 },
            { key: "name",            width: 25 },
            { key: "kategori",        width: 20 },
            { key: "ruangan",         width: 20 },
            { key: "jumlah",          width: 10 },
            { key: "satuan",          width: 12 },
            { key: "tahun_pengadaan", width: 18 },
            { key: "keterangan",      width: 30 },
        ];

        // Isi data
        barangs.forEach((item, index) => {
            const b = item.toJSON();

            const dataRow = worksheet.addRow([
                index + 1,
                b.kode_barang,
                b.name,
                b.kategori?.name_kategori ?? "-",
                b.ruangan?.name_ruangan   ?? "-",
                b.jumlah          ?? 0,
                b.satuan          ?? "-",
                b.tahun_pengadaan,
                b.keterangan      ?? "-",
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: "middle" };
            });

            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F4FF" } };
                });
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(["", "", "", "", "TOTAL", totalJumlah, "", "", ""]);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).font = { bold: true, color: { argb: "FF1A73E8" } };
        totalRow.getCell(5).border = rowBorder;
        totalRow.getCell(6).border = rowBorder;

        res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="laporan-barang-${labelFilter.replace(/ /g, "-")}.xlsx"`,
        });

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        if (error.status) return res.status(error.status).json({ message: error.message });
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};