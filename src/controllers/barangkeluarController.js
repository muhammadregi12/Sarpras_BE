const BarangKeluar = require("../models/barangkeluarModels");
const Barang = require("../models/barangModels");
const Cabang = require("../models/cabangModels");
const User = require("../models/userModels");
const { generatePDF } = require("../services/exportPdf");
const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const Ruangan = require("../models/ruanganModels");

exports.getAllBarangKeluar = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const barangKeluar = await BarangKeluar.findAndCountAll({
            attributes: ["id", "jumlah_keluar", "tanggal_keluar", "keterangan"],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                }
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                }
            ],
            include: [
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
            message: "Get All Barang Keluar",
            data: barangKeluar.rows,
            total: barangKeluar.count,
            limit: limit,
            page: page
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBarangKeluarById = async (req, res) => {
    try {
        
        const barangKeluar = await BarangKeluar.findByPk(req.params.id, {
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
                }
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                }
            ],
            include: [
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

        return res.status(200).json({
            message: "Get Barang Keluar By Id",
            data: barangKeluar
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.createBarangKeluar = async (req, res) => {
    try {
        
        const { barang_id, user_id, cabang_id, ruangan_id, jumlah_keluar, tanggal_keluar, keterangan } = req.body;

        if(!barang_id || !cabang_id || !ruangan_id || !jumlah_keluar || !tanggal_keluar) {
            return res.status(400).json({
                message: "Barang Id, Cabang Id, Ruangan Id, Jumlah Keluar, dan Tanggal Keluar harus diisi"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        if (!updateJumlahBarang) {
            return res.status(404).json({
                message: "Barang Not Found"
            });
        }

        if (updateJumlahBarang) {
            const newJumlah = updateJumlahBarang.jumlah - parseInt(jumlah_keluar);
            if (newJumlah < 0) {
                return res.status(400).json({
                    message: "Jumlah Keluar melebihi jumlah barang yang tersedia"
                });
            }
        }

        const barangKeluar = await BarangKeluar.create({
            barang_id,
            user_id: req.user.id,
            cabang_id,
            ruangan_id,
            jumlah_keluar,
            tanggal_keluar,
            keterangan
        })

        updateJumlahBarang.jumlah -= parseInt(jumlah_keluar);
        await updateJumlahBarang.save();

        return res.status(201).json({
            message: "Create Barang Keluar",
            data: barangKeluar
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateBarangKeluar = async (req, res) => {
    try {
        const { id } = req.params;
        const { barang_id, cabang_id, ruangan_id, jumlah_keluar, tanggal_keluar, keterangan } = req.body;

        const barangKeluar = await BarangKeluar.findByPk(id);
        if (!barangKeluar) {
            return res.status(404).json({
                message: "Barang Keluar Not Found"
            });
        }

        const oldBarangId = parseInt(barangKeluar.barang_id);
        const newBarangId = parseInt(barang_id);
        const oldJumlahKeluar = parseInt(barangKeluar.jumlah_keluar);
        const newJumlahKeluar = parseInt(jumlah_keluar);

        if (oldBarangId !== newBarangId) {
            const oldBarang = await Barang.findByPk(oldBarangId);
            if (oldBarang) {
                oldBarang.jumlah += oldJumlahKeluar;
                await oldBarang.save();
            }

            const newBarang = await Barang.findByPk(newBarangId);
            if (!newBarang) {
                return res.status(404).json({ message: "Barang Not Found" });
            }

            if (newBarang.jumlah < newJumlahKeluar) {
                return res.status(400).json({
                    message: "Jumlah Keluar melebihi jumlah barang yang tersedia"
                });
            }

            newBarang.jumlah -= newJumlahKeluar;
            await newBarang.save();

        } else {
            const barang = await Barang.findByPk(newBarangId);
            if (!barang) {
                return res.status(404).json({ message: "Barang Not Found" });
            }

            const stokAktual = barang.jumlah + oldJumlahKeluar;

            if (stokAktual < newJumlahKeluar) {
                return res.status(400).json({
                    message: "Jumlah Keluar melebihi jumlah barang yang tersedia"
                });
            }
            
            barang.jumlah = stokAktual - newJumlahKeluar;
            await barang.save();
        }

        const updatedBarangKeluar = await barangKeluar.update({
            barang_id: newBarangId,
            user_id: req.user.id,
            cabang_id,
            ruangan_id,
            jumlah_keluar: newJumlahKeluar,
            tanggal_keluar,
            keterangan
        });

        return res.status(200).json({
            message: "Update Barang Keluar",
            data: updatedBarangKeluar
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.deleteBarangKeluar = async (req, res) => {
    try {
        
        const { id } = req.params;
        const barangKeluar = await BarangKeluar.findByPk(id);
        if (!barangKeluar) {
            return res.status(404).json({
                message: "Barang Keluar Not Found"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barangKeluar.barang_id);
        if (updateJumlahBarang) {
            updateJumlahBarang.jumlah += parseInt(barangKeluar.jumlah_keluar);
            await updateJumlahBarang.save();
        }

        await barangKeluar.destroy();


        return res.status(200).json({
            message: "Delete Barang Keluar"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.exportPDFBarangKeluar = async (req, res) => {
    try {

        const barangKeluar = await BarangKeluar.findAll({
            order: [['tanggal_keluar', 'DESC']],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
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

        const tableRows = barangKeluar.map((item, index) => {
            const d = item.toJSON();

            const tanggalKeluar = d.tanggal_keluar
                ? new Date(d.tanggal_keluar).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="badge">${d.barang ? d.barang.kode_barang : '-'}</span></td>
                    <td>${d.barang ? d.barang.name : '-'}</td>
                    <td>${d.cabang ? d.cabang.name_cabang : '-'}</td>
                    <td>${d.ruangan ? d.ruangan.name_ruangan : '-'}</td>
                    <td>${d.jumlah_keluar}</td>
                    <td>${tanggalKeluar}</td>
                    <td>${d.keterangan ?? '-'}</td>
                </tr>
            `;
        }).join('');

        const data = {
            printDate: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
            totalBarangKeluar: barangKeluar.length,
            tableRows,
        };

        const pdfBuffer = await generatePDF('barangKeluar.html', data);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="laporan-barang-keluar.pdf"',
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

exports.exportExcelBarangKeluar = async (req, res) => {
    try {

        const barangKeluar = await BarangKeluar.findAll({
            order: [['tanggal_keluar', 'DESC']],
            include: [
                {
                    model: Barang,
                    as: "barang",
                    attributes: ["id", "name", "kode_barang"]
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
        const worksheet = workbook.addWorksheet('Data Barang Keluar');

        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE74C3C' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FFFF9999' } },
                bottom: { style: 'thin', color: { argb: 'FFFF9999' } },
                left:   { style: 'thin', color: { argb: 'FFFF9999' } },
                right:  { style: 'thin', color: { argb: 'FFFF9999' } },
            }
        };

        const rowBorder = {
            top:    { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left:   { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right:  { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };

        // Judul
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'DATA BARANG KELUAR';
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFE74C3C' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 30;

        // Tanggal cetak
        worksheet.mergeCells('A2:G2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`;
        dateCell.font = { italic: true, size: 10, color: { argb: 'FF888888' } };
        dateCell.alignment = { horizontal: 'center' };
        worksheet.getRow(2).height = 20;

        // Baris kosong
        worksheet.addRow([]);

        // Header kolom
        const headerRow = worksheet.addRow([
            'No', 'Kode Barang', 'Nama Barang', 'Cabang',
            'Jumlah Keluar', 'Tanggal Keluar', 'Keterangan'
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
            { key: 'cabang',        width: 20 },
            { key: 'ruangan',       width: 20 },
            { key: 'jumlah_keluar', width: 15 },
            { key: 'tanggal_keluar',width: 20 },
            { key: 'keterangan',    width: 30 },
        ];

        // Isi data
        barangKeluar.forEach((item, index) => {
            const d = item.toJSON();

            const tanggalKeluar = d.tanggal_keluar
                ? new Date(d.tanggal_keluar).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang  ?? '-',
                d.barang?.name         ?? '-',
                d.cabang?.name_cabang  ?? '-',
                d.ruangan?.name_ruangan ?? '-',
                d.jumlah_keluar,
                tanggalKeluar,
                d.keterangan           ?? '-',
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: 'middle' };
            });

            // Warna selang-seling
            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } };
                });
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(['', '', '', 'Total', barangKeluar.length, '', '']);
        totalRow.getCell(4).font = { bold: true };
        totalRow.getCell(5).font = { bold: true, color: { argb: 'FFE74C3C' } };

        // Kirim response
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="laporan-barang-keluar.xlsx"',
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
