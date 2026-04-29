const BarangMasuk = require("../../models/barangmasukModels");
const Barang      = require("../../models/barangModels");
const Cabang      = require("../../models/cabangModels");
const Ruangan     = require("../../models/ruanganModels");
const Supplier    = require("../../models/supplierModels");
const User        = require("../../models/userModels");
const { Op }      = require("sequelize");
const { generatePDF } = require("../../services/exportPdf");
const ExcelJS     = require("exceljs");

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatTanggal = (tgl) =>
    tgl ? new Date(tgl).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";


function buildPeriodeWhere({ tipe, tanggal, bulan, tahun }) {
    if (!tipe) throw { status: 400, message: "Parameter 'tipe' wajib diisi: harian | bulanan | tahunan" };

    if (tipe === "harian") {
        if (!tanggal) throw { status: 400, message: "Parameter 'tanggal' wajib diisi (format: YYYY-MM-DD)" };
        const start = new Date(tanggal); start.setHours(0, 0, 0, 0);
        const end   = new Date(tanggal); end.setHours(23, 59, 59, 999);
        return {
            whereClause:  { tanggal_masuk: { [Op.between]: [start, end] } },
            labelPeriode: new Date(tanggal).toLocaleDateString("id-ID", { dateStyle: "long" }),
        };
    }

    if (tipe === "bulanan") {
        if (!bulan || !tahun) throw { status: 400, message: "Parameter 'bulan' dan 'tahun' wajib diisi" };
        const start = new Date(tahun, bulan - 1, 1);
        const end   = new Date(tahun, bulan, 0, 23, 59, 59, 999);
        return {
            whereClause:  { tanggal_masuk: { [Op.between]: [start, end] } },
            labelPeriode: new Date(tahun, bulan - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        };
    }

    if (tipe === "tahunan") {
        if (!tahun) throw { status: 400, message: "Parameter 'tahun' wajib diisi" };
        const start = new Date(tahun, 0, 1);
        const end   = new Date(tahun, 11, 31, 23, 59, 59, 999);
        return {
            whereClause:  { tanggal_masuk: { [Op.between]: [start, end] } },
            labelPeriode: `Tahun ${tahun}`,
        };
    }

    throw { status: 400, message: "Tipe tidak valid. Gunakan: harian | bulanan | tahunan" };
}

function buildLokasiFilter(whereClause, { cabang_id, ruangan_id }) {
    const where = { ...whereClause };
    if (cabang_id)  where.cabang_id  = cabang_id;
    if (ruangan_id) where.ruangan_id = ruangan_id;
    return where;
}

const standardInclude = [
    { model: Barang,   as: "barang",   attributes: ["id", "name", "kode_barang"] },
    { model: Supplier, as: "supplier", attributes: ["id", "name_supplier"] },
    { model: Cabang,   as: "cabang",   attributes: ["id", "name_cabang"] },
    { model: Ruangan,  as: "ruangan",  attributes: ["id", "name_ruangan"], required: false },
    { model: User,     as: "user",     attributes: ["id", "name"] },
];

async function resolveLokasiInfo({ cabang_id, ruangan_id }) {
    let infoCabang  = null;
    let infoRuangan = null;

    if (cabang_id) {
        infoCabang = await Cabang.findByPk(cabang_id, { attributes: ["id", "name_cabang"] });
        if (!infoCabang) throw { status: 404, message: "Cabang tidak ditemukan" };
    }

    if (ruangan_id) {
        infoRuangan = await Ruangan.findByPk(ruangan_id, { attributes: ["id", "name_ruangan"] });
        if (!infoRuangan) throw { status: 404, message: "Ruangan tidak ditemukan" };
    }

    return { infoCabang, infoRuangan };
}


exports.getLaporanBarangMasuk = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun });
        const finalWhere = buildLokasiFilter(whereClause, { cabang_id, ruangan_id });

        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });

        const data = await BarangMasuk.findAll({
            where:   finalWhere,
            order:   [["tanggal_masuk", "DESC"]],
            include: standardInclude,
        });

        const totalHarga = data.reduce((sum, item) => sum + item.jumlah * item.harga_satuan, 0);

        const labelLokasi = [
            infoCabang  ? `Cabang: ${infoCabang.name_cabang}`      : null,
            infoRuangan ? `Ruangan: ${infoRuangan.name_ruangan}`   : null,
        ].filter(Boolean).join(" | ");

        return res.status(200).json({
            message:     `Laporan Barang Masuk - ${labelPeriode}${labelLokasi ? ` | ${labelLokasi}` : ""}`,
            periode:     labelPeriode,
            filter: {
                cabang:  infoCabang  ? { id: infoCabang.id,  name: infoCabang.name_cabang }   : null,
                ruangan: infoRuangan ? { id: infoRuangan.id, name: infoRuangan.name_ruangan } : null,
            },
            total_data:  data.length,
            total_harga: totalHarga,
            data:        data.map((item) => item.toJSON()),
        });

    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

exports.exportPDFLaporanBarangMasuk = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun });
        const finalWhere = buildLokasiFilter(whereClause, { cabang_id, ruangan_id });

        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });

        const barangMasukData = await BarangMasuk.findAll({
            where:   finalWhere,
            order:   [["tanggal_masuk", "DESC"]],
            include: standardInclude,
        });

        const totalHarga = barangMasukData.reduce((sum, item) => sum + item.jumlah * item.harga_satuan, 0);

        const labelLokasi = [
            infoCabang  ? infoCabang.name_cabang      : null,
            infoRuangan ? infoRuangan.name_ruangan    : null,
        ].filter(Boolean).join(" - ");

        const tableRows = barangMasukData.map((item, index) => {
            const d = item.toJSON();
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.barang?.kode_barang        ?? "-"}</td>
                    <td>${d.barang?.name               ?? "-"}</td>
                    <td>${d.supplier?.name_supplier    ?? "-"}</td>
                    <td>${d.cabang?.name_cabang         ?? "-"}</td>
                    <td>${d.ruangan?.name_ruangan       ?? "-"}</td>
                    <td>${d.jumlah}</td>
                    <td>Rp ${Number(d.harga_satuan).toLocaleString("id-ID")}</td>
                    <td>Rp ${Number(d.jumlah * d.harga_satuan).toLocaleString("id-ID")}</td>
                    <td>${formatTanggal(d.tanggal_masuk)}</td>
                </tr>
            `;
        }).join("");

        const pdfData = {
            printDate:    new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }),
            labelPeriode: labelLokasi ? `${labelPeriode} | ${labelLokasi}` : labelPeriode,
            totalData:    barangMasukData.length,
            totalHarga:   `Rp ${totalHarga.toLocaleString("id-ID")}`,
            tableRows,
        };

        const pdfBuffer = await generatePDF("laporanBarangMasuk.html", pdfData);

        const fileLabel = [tipe, labelLokasi.replace(/ /g, "-")].filter(Boolean).join("-");

        res.set({
            "Content-Type":        "application/pdf",
            "Content-Disposition": `attachment; filename="laporan-barang-masuk-${fileLabel}.pdf"`,
            "Content-Length":      pdfBuffer.length,
        });

        return res.send(pdfBuffer);

    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};


exports.exportExcelLaporanBarangMasuk = async (req, res) => {
    try {
        const { tipe, tanggal, bulan, tahun, cabang_id, ruangan_id } = req.query;

        const { whereClause, labelPeriode } = buildPeriodeWhere({ tipe, tanggal, bulan, tahun });
        const finalWhere = buildLokasiFilter(whereClause, { cabang_id, ruangan_id });

        const { infoCabang, infoRuangan } = await resolveLokasiInfo({ cabang_id, ruangan_id });

        const barangMasukData = await BarangMasuk.findAll({
            where:   finalWhere,
            order:   [["tanggal_masuk", "DESC"]],
            include: standardInclude,
        });

        const totalHarga = barangMasukData.reduce((sum, item) => sum + item.jumlah * item.harga_satuan, 0);

        const labelLokasi = [
            infoCabang  ? infoCabang.name_cabang      : null,
            infoRuangan ? infoRuangan.name_ruangan    : null,
        ].filter(Boolean).join(" - ");

        const fullLabel = labelLokasi ? `${labelPeriode} | ${labelLokasi}` : labelPeriode;

        // ── Workbook ────────────────────────────────────────────────────────
        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Laporan Barang Masuk");

        const COLS = 10; // jumlah kolom (tambah 1 untuk Ruangan)
        const mergeRange = (row) => `A${row}:J${row}`;

        const headerStyle = {
            font:      { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
            fill:      { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A73E8" } },
            alignment: { horizontal: "center", vertical: "middle" },
            border: {
                top:    { style: "thin", color: { argb: "FFB0C4DE" } },
                bottom: { style: "thin", color: { argb: "FFB0C4DE" } },
                left:   { style: "thin", color: { argb: "FFB0C4DE" } },
                right:  { style: "thin", color: { argb: "FFB0C4DE" } },
            },
        };

        const rowBorder = {
            top:    { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left:   { style: "thin", color: { argb: "FFE0E0E0" } },
            right:  { style: "thin", color: { argb: "FFE0E0E0" } },
        };

        // Judul
        worksheet.mergeCells("A1:J1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value     = "LAPORAN BARANG MASUK";
        titleCell.font      = { bold: true, size: 14, color: { argb: "FF1A73E8" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // Periode + Lokasi
        worksheet.mergeCells("A2:J2");
        const periodeCell = worksheet.getCell("A2");
        periodeCell.value     = `Periode: ${fullLabel}`;
        periodeCell.font      = { bold: true, size: 11, color: { argb: "FF333333" } };
        periodeCell.alignment = { horizontal: "center" };
        worksheet.getRow(2).height = 22;

        // Tanggal cetak
        worksheet.mergeCells("A3:J3");
        const dateCell = worksheet.getCell("A3");
        dateCell.value     = `Dicetak pada: ${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}`;
        dateCell.font      = { italic: true, size: 10, color: { argb: "FF888888" } };
        dateCell.alignment = { horizontal: "center" };
        worksheet.getRow(3).height = 18;

        worksheet.addRow([]); // baris kosong

        // Header kolom
        const headerRow = worksheet.addRow([
            "No", "Kode Barang", "Nama Barang", "Supplier",
            "Cabang", "Ruangan", "Jumlah", "Harga Satuan", "Total Harga", "Tanggal Masuk",
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font      = headerStyle.font;
            cell.fill      = headerStyle.fill;
            cell.alignment = headerStyle.alignment;
            cell.border    = headerStyle.border;
        });

        worksheet.columns = [
            { key: "no",             width: 5  },
            { key: "kode_barang",    width: 15 },
            { key: "name",           width: 25 },
            { key: "supplier",       width: 20 },
            { key: "cabang",         width: 20 },
            { key: "ruangan",        width: 20 },
            { key: "jumlah",         width: 10 },
            { key: "harga_satuan",   width: 18 },
            { key: "total_harga",    width: 20 },
            { key: "tanggal_masuk",  width: 22 },
        ];

        // Isi data
        barangMasukData.forEach((item, index) => {
            const d = item.toJSON();

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang       ?? "-",
                d.barang?.name              ?? "-",
                d.supplier?.name_supplier   ?? "-",
                d.cabang?.name_cabang        ?? "-",
                d.ruangan?.name_ruangan      ?? "-",
                d.jumlah,
                d.harga_satuan,
                d.jumlah * d.harga_satuan,
                formatTanggal(d.tanggal_masuk),
            ]);

            dataRow.getCell(8).numFmt = "#,##0";
            dataRow.getCell(9).numFmt = "#,##0";
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
        const totalRow = worksheet.addRow(["", "", "", "", "TOTAL", "", barangMasukData.length, "", totalHarga, ""]);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(7).font = { bold: true, color: { argb: "FF1A73E8" } };
        totalRow.getCell(9).font = { bold: true, color: { argb: "FF1A73E8" } };
        totalRow.getCell(9).numFmt = "#,##0";

        const fileLabel = [tipe, labelLokasi.replace(/ /g, "-")].filter(Boolean).join("-");

        res.set({
            "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="laporan-barang-masuk-${fileLabel}.xlsx"`,
        });

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        if (err.status) return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};