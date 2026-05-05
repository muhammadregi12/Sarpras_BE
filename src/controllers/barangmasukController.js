
const BarangMasuk = require("../models/barangmasukModels");
const Barang = require("../models/barangModels");
const Cabang = require("../models/cabangModels");
const Ruangan = require("../models/ruanganModels");
const Supplier = require("../models/supplierModels");
const User = require("../models/userModels");
const { generatePDF }  = require("../services/exportPdf");
const ExcelJS = require("exceljs")

exports.getAllBarangMasuk = async (req, res) => {
    try {
        
       const limit = parseInt(req.query.limit) || 10;
       const page = parseInt(req.query.page) || 1;
       const offset = (page - 1) * limit;

       const barangMasuk = await BarangMasuk.findAndCountAll({
            attributes: ["id", "jumlah", "tanggal_masuk", "harga_satuan"],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: ["id", "name_supplier"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ],
            limit: limit,
            offset: offset
        });


        return res.status(200).json({
            message: "Get All Barang Masuk",
            data: barangMasuk.rows,
            total: barangMasuk.count,
            page: page,
            limit: limit
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBarangMasukById = async (req, res) => {
    try {
        
        const barangMasuk = await BarangMasuk.findByPk(req.params.id, {
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: ["id", "name_supplier"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        });

        if(!barangMasuk) {
            return res.status(404).json({
                message: "Barang Masuk Not Found"
            });
        }

        return res.status(200).json({
            message: "Get Barang Masuk By Id",
            data: barangMasuk
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.createBarangMasuk = async (req, res) => {
    try {
        
        const { barang_id, supplier_id, cabang_id, ruangan_id, jumlah, no_dokumen, harga_satuan, tanggal_masuk, keterangan, user_id } = req.body;

        if (!barang_id || !supplier_id || !cabang_id || !ruangan_id || !harga_satuan || !tanggal_masuk || !jumlah) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const barangMasuk = await BarangMasuk.create({
            barang_id,
            supplier_id,
            cabang_id,
            ruangan_id,
            no_dokumen,
            harga_satuan,
            tanggal_masuk,
            keterangan,
            user_id: req.user.id,
            jumlah
        })

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        if (updateJumlahBarang) {
            updateJumlahBarang.jumlah += jumlah;
            await updateJumlahBarang.save();
        }

        return res.status(201).json({
            message: "Create Barang Masuk",
            data: barangMasuk
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateBarangMasuk = async (req, res) => {
    try {
        
        const { barang_id, user_id, supplier_id, cabang_id, ruangan_id, jumlah, no_dokumen, harga_satuan, tanggal_masuk, keterangan } = req.body;

        if (!barang_id || !supplier_id || !cabang_id || !ruangan_id || !harga_satuan || !tanggal_masuk || !jumlah) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const barangMasuk = await BarangMasuk.findByPk(req.params.id);
        if (!barangMasuk) {
            return res.status(404).json({
                message: "Barang Masuk Not Found"
            });
        }

        // Simpan nilai lama sebelum diupdate
        const oldBarangId = barangMasuk.barang_id;
        const oldJumlah = barangMasuk.jumlah;

        if (oldBarangId !== barang_id) {
            const oldBarang = await Barang.findByPk(oldBarangId);
            if (oldBarang) {
                oldBarang.jumlah -= oldJumlah; 
                await oldBarang.save();
            }

            const newBarang = await Barang.findByPk(barang_id);
            if (newBarang) {
                newBarang.jumlah += jumlah;  
                await newBarang.save();
            }
        } else {
            const selisih = jumlah - oldJumlah;
            const barang = await Barang.findByPk(barang_id);
            if (barang) {
                barang.jumlah += selisih;
                await barang.save();
            }
        }

        await barangMasuk.update({
            barang_id,
            supplier_id,
            cabang_id,
            ruangan_id,
            jumlah,
            no_dokumen,
            harga_satuan,
            tanggal_masuk,
            keterangan,
            user_id: req.user.id
        });


        return res.status(200).json({
            message: "Update Barang Masuk",
            data: barangMasuk
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteBarangMasuk = async (req, res) => {
    try {
        const barangMasuk = await BarangMasuk.findByPk(req.params.id);
        if (!barangMasuk) {
            return res.status(404).json({
                message: "Barang Masuk Not Found"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barangMasuk.barang_id);
        if (updateJumlahBarang) {
            updateJumlahBarang.jumlah -= barangMasuk.jumlah;
            await updateJumlahBarang.save();
        }

        await barangMasuk.destroy();

        return res.status(200).json({
            message: "Delete Barang Masuk"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.exportPDFBarangMasuk = async (req, res) => {
    try {
        
        const barangMasuk = await BarangMasuk.findAll({
            order: [['tanggal_masuk', 'DESC']],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: ["id", "name_supplier"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        });

        const tableRows = barangMasuk.map((item, index) => {
            const d = item.toJSON();
            const tanggal = d.tanggal_masuk
                ? new Date(d.tanggal_masuk).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
                : '-';

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.barang ? d.barang.kode_barang : "-"}</td>
                    <td>${d.barang ? d.barang.name : "-"}</td>
                    <td>${d.supplier ? d.supplier.name_supplier : "-"}</td>
                    <td>${d.cabang ? d.cabang.name_cabang : "-"}</td>
                    <td>${d.ruangan ? d.ruangan.name_ruangan : "-"}</td>
                    <td>${d.jumlah}</td>
                    <td>${d.harga_satuan}</td>
                    <td>${tanggal}</td>
                </tr>
            `;
        }).join('');

        const data = {
            printDate: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
            totalBarangMasuk: barangMasuk.length,
            tableRows,
        };

        const pdfBuffer = await generatePDF('barangMasuk.html', data);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="barang_masuk.pdf"',
            'Content-Length': pdfBuffer.length
        });

        return res.send(pdfBuffer);

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.exportExcelBarangMasuk = async (req, res) => {
    try {

        const barangMasuk = await BarangMasuk.findAll({
            order: [['tanggal_masuk', 'DESC']],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                },
                {
                    model: Supplier,
                    as: "supplier",
                    attributes: ["id", "name_supplier"]
                },
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                },
                {
                    model: Cabang,
                    as: "cabang",
                    attributes: ["id", "name_cabang"]
                },
                {
                    model: Ruangan,
                    as: "ruangan",
                    attributes: ["id", "name_ruangan"]
                }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Barang Masuk');

        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A73E8' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FFB0C4DE' } },
                bottom: { style: 'thin', color: { argb: 'FFB0C4DE' } },
                left:   { style: 'thin', color: { argb: 'FFB0C4DE' } },
                right:  { style: 'thin', color: { argb: 'FFB0C4DE' } },
            }
        };

        const rowBorder = {
            top:    { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left:   { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right:  { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };

        // Judul
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'DATA BARANG MASUK';
        titleCell.font = { bold: true, size: 14, color: { argb: 'FF1A73E8' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Tanggal cetak
        worksheet.mergeCells('A2:H2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`;
        dateCell.font = { italic: true, size: 10, color: { argb: 'FF888888' } };
        dateCell.alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Baris kosong
        worksheet.addRow([]);

        // Header kolom
        const headerRow = worksheet.addRow([
            'No', 'Kode Barang', 'Nama Barang', 'Supplier',
            'Cabang', 'Jumlah', 'Harga Satuan', 'Tanggal Masuk'
        ]);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.font      = headerStyle.font;
            cell.fill      = headerStyle.fill;
            cell.alignment = headerStyle.alignment;
            cell.border    = headerStyle.border;
        });

        // Lebar kolom
        worksheet.columns = [
            { key: 'no',            width: 5  },
            { key: 'kode_barang',   width: 15 },
            { key: 'name',          width: 25 },
            { key: 'supplier',      width: 20 },
            { key: 'cabang',        width: 20 },
            { key: 'ruangan',        width: 20 },
            { key: 'jumlah',        width: 10 },
            { key: 'harga_satuan',  width: 15 },
            { key: 'tanggal_masuk', width: 22 },
        ];

        // Isi data
        barangMasuk.forEach((item, index) => {
            const d = item.toJSON();

            const tanggalMasuk = d.tanggal_masuk
                ? new Date(d.tanggal_masuk).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang      ?? '-',
                d.barang?.name             ?? '-',
                d.supplier?.name_supplier  ?? '-',
                d.cabang?.name_cabang      ?? '-',
                d.ruangan?.name_ruangan    ?? '-',
                d.jumlah,
                d.harga_satuan,
                tanggalMasuk,
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: 'middle' };
            });

            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
                });
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(['', '', '', '', 'Total', barangMasuk.length, '', '']);
        totalRow.getCell(5).font = { bold: true };
        totalRow.getCell(6).font = { bold: true, color: { argb: 'FF1A73E8' } };

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="laporan-barang-masuk.xlsx"',
        });

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};