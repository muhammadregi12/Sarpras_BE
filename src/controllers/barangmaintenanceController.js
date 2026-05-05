const BarangMaintenance = require("../models/barangmaintenanceModels");
const Barang = require("../models/barangModels");
const User = require("../models/userModels");
const { generatePDF } = require("../services/exportPdf");
const ExcelJS = require("exceljs");

exports.getAllBarangMaintenance = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const barangMaintenance = await BarangMaintenance.findAndCountAll({
            attributes: ["id", "tanggal_maintenance", "status", "keterangan"],
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
                }
            ],
            
        });

        return res.status(200).json({
            message: "Get All Barang Maintenance",
            data: barangMaintenance.rows,
            total: barangMaintenance.count,
            page: page,
            limit: limit,
            offset: offset
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.getBarangMaintenanceById = async (req, res) => {
    try {

        const barangMaintenance = await BarangMaintenance.findByPk(req.params.id, {
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
                }
            ],
        })
        
        return res.status(200).json({
            message: "Get Barang Maintenance By Id",
            data: barangMaintenance
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.createBarangMaintenance = async (req, res) => {
    try {
        
        const { barang_id, tanggal_maintenance, jumlah_maintenance, status, keterangan, biaya } = req.body;

        if (!barang_id || !tanggal_maintenance || !jumlah_maintenance || !status) {
            return res.status(400).json({
                message: "Barang ID, Tanggal Maintenance, jumlah maintenance dan Status harus diisi"
            })
        }

        const barang = await Barang.findByPk(barang_id);
        if (!barang) {
            return res.status(404).json({
                message: "Barang tidak ditemukan"
            })
        }

        if(barang.jumlah < parseInt(jumlah_maintenance)) {
            return res.status(400).json({
                message: "Jumlah maintenance melebihi stok barang"
            })
        }

        const barangMaintenance = await BarangMaintenance.create({
            barang_id,
            tanggal_maintenance,
            jumlah_maintenance,
            status,
            user_id: req.user.id,
            keterangan,
            biaya
        });

        barang.jumlah -= parseInt(jumlah_maintenance);
        await barang.save();

        return res.status(201).json({
            message: "Create Barang Maintenance berhasil",
            data: barangMaintenance
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateBarangMaintenance = async (req, res) => {
    try {
        const { barang_id, biaya, tanggal_maintenance, jumlah_maintenance, keterangan } = req.body;

        if (!barang_id || !tanggal_maintenance || !jumlah_maintenance) {
            return res.status(400).json({
                message: "Barang ID, Tanggal Maintenance, Jumlah Maintenance harus diisi"
            });
        }

        const barangMaintenance = await BarangMaintenance.findByPk(req.params.id);
        if (!barangMaintenance) {
            return res.status(404).json({
                message: "Barang Maintenance tidak ditemukan"
            });
        }

        const oldBarangId = parseInt(barangMaintenance.barang_id);
        const newBarangId = parseInt(barang_id);
        const oldJumlahMaintenance = parseInt(barangMaintenance.jumlah_maintenance);
        const newJumlahMaintenance = parseInt(jumlah_maintenance);

        if (oldBarangId !== newBarangId) {
            
            const oldBarang = await Barang.findByPk(oldBarangId);
            if (oldBarang) {
                oldBarang.jumlah += oldJumlahMaintenance;
                await oldBarang.save();
            }

            const newBarang = await Barang.findByPk(newBarangId);
            if (!newBarang) {
                return res.status(404).json({ message: "Barang tidak ditemukan" });
            }

            if (newBarang.jumlah < newJumlahMaintenance) {
                return res.status(400).json({
                    message: "Jumlah maintenance melebihi stok barang"
                });
            }

            newBarang.jumlah -= newJumlahMaintenance;
            await newBarang.save();

        } else {
            const barang = await Barang.findByPk(newBarangId);
            if (!barang) {
                return res.status(404).json({ message: "Barang tidak ditemukan" });
            }

            const stokAktual = barang.jumlah + oldJumlahMaintenance;

            if (stokAktual < newJumlahMaintenance) {
                return res.status(400).json({
                    message: "Jumlah maintenance melebihi stok barang"
                });
            }

            barang.jumlah = stokAktual - newJumlahMaintenance;
            await barang.save();
        }

        const updateBarangMaintenance = await barangMaintenance.update({
            barang_id: newBarangId,
            tanggal_maintenance,
            jumlah_maintenance: newJumlahMaintenance,
            keterangan,
            biaya,
            user_id: req.user.id
        });

        return res.status(200).json({
            message: "Update Barang Maintenance berhasil",
            data: updateBarangMaintenance
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.updateStatusBarangMaintenance = async (req, res) => {
    try {
        
        const { status, tanggal_selesai, jumlah_selesai, jumlah_rusak_hasil, tingkat_kerusakan } = req.body;

        if (!tanggal_selesai) {
            return res.status(400).json({
                message: "Status dan Tanggal Selesai harus diisi"
            })
        }

        const barangMaintenance = await BarangMaintenance.findByPk(req.params.id);
        if (!barangMaintenance) {
            return res.status(404).json({
                message: "Barang Maintenance tidak ditemukan"
            })
        }

        if (barangMaintenance.status === "selesai") {
            return res.status(400).json({
                message: "Barang maintenance sudah selesai, tidak bisa update status"
            })
        }

        const totalMaintenance = parseInt(barangMaintenance.jumlah_maintenance);
        const selesai = parseInt(jumlah_selesai)
        const rusak = parseInt(jumlah_rusak_hasil)

        if (selesai + rusak > totalMaintenance) {
            return res.status(400).json({
                message: "Jumlah selesai dan rusak melebihi jumlah maintenance"
            })
        }

        const barang = await Barang.findByPk(barangMaintenance.barang_id);

        if(selesai > 0 && barang) {
            barang.jumlah += selesai;
            await barang.save();
        }

        if(rusak > 0 ) {
            if(!tingkat_kerusakan) {
                return res.status(400).json({
                    message: "Tingkat kerusakan harus diisi jika ada barang yang rusak"
                })
        }

            await BarangRusak.create({
                barang_id: barangMaintenance.barang_id,
                jumlah_rusak: rusak,
                tanggal_rusak: tanggal_selesai,
                tingkat_kerusakan,
                keterangan: `Barang rusak dari maintenance dengan id ${barangMaintenance.id}`,
                user_id: req.user.id
            })
        }


        const updateStatusBarangMaintenance = await barangMaintenance.update({
            status: "selesai",
            tanggal_selesai,
            jumlah_selesai: selesai,
            jumlah_rusak_hasil: rusak,
        });

        return res.status(200).json({
            message: "Update status barang maintenance berhasil",
            data: updateStatusBarangMaintenance
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteBarangMaintenance = async (req, res) => {
    try {
        
        const barangMaintenance = await BarangMaintenance.findByPk(req.params.id);
        if (!barangMaintenance) {
            return res.status(404).json({
                message: "Barang Maintenance tidak ditemukan"
            })
        }

        const barang = await Barang.findByPk(barangMaintenance.barang_id);
        if (barang) {
            const newJumlah = barang.jumlah += parseInt(barangMaintenance.jumlah_maintenance);
            await barang.update({ jumlah: newJumlah });
        }

        await barangMaintenance.destroy();

        return res.status(200).json({
            message: "Delete Barang Maintenance berhasil",
            data: barangMaintenance
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.exportPDFBarangMaintenance = async (req, res) => {
    try {

        const barangMaintenance = await BarangMaintenance.findAll({
            order: [['tanggal_maintenance', 'DESC']],
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
                }
            ]
        });

        const tableRows = barangMaintenance.map((item, index) => {
            const d = item.toJSON();

            const tanggalMaintenance = d.tanggal_maintenance
                ? new Date(d.tanggal_maintenance).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const tanggalSelesai = d.tanggal_selesai
                ? new Date(d.tanggal_selesai).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const statusBadge = d.status === 'selesai'
                ? `<span class="badge-selesai">Selesai</span>`
                : `<span class="badge-proses">Dalam Proses</span>`;

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${d.barang ? d.barang.kode_barang : '-'}</td>
                    <td>${d.barang ? d.barang.name : '-'}</td>
                    <td>${d.jumlah_maintenance ?? '-'}</td>
                    <td>${tanggalMaintenance}</td>
                    <td>${tanggalSelesai}</td>
                    <td>${statusBadge}</td>
                    <td>${d.keterangan ?? '-'}</td>
                </tr>
            `;
        }).join('');

        const data = {
            printDate: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
            totalMaintenance: barangMaintenance.length,
            tableRows,
        };

        const pdfBuffer = await generatePDF('barangMaintenance.html', data);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="laporan-maintenance.pdf"',
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

exports.exportExcelBarangMaintenance = async (req, res) => {
    try {

        const barangMaintenance = await BarangMaintenance.findAll({
            order: [['tanggal_maintenance', 'DESC']],
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
                }
            ]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data Barang Maintenance');

        const headerStyle = {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top:    { style: 'thin', color: { argb: 'FFFFD699' } },
                bottom: { style: 'thin', color: { argb: 'FFFFD699' } },
                left:   { style: 'thin', color: { argb: 'FFFFD699' } },
                right:  { style: 'thin', color: { argb: 'FFFFD699' } },
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
        titleCell.value = 'LAPORAN DATA BARANG MAINTENANCE';
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFE67E22' } };
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
            'No', 'Kode Barang', 'Nama Barang', 'Jumlah',
            'Tanggal Maintenance', 'Tanggal Selesai', 'Status', 'Keterangan'
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
            { key: 'no',                  width: 5  },
            { key: 'kode_barang',         width: 15 },
            { key: 'name',                width: 25 },
            { key: 'jumlah_maintenance',  width: 10 },
            { key: 'tanggal_maintenance', width: 22 },
            { key: 'tanggal_selesai',     width: 22 },
            { key: 'status',              width: 15 },
            { key: 'keterangan',          width: 30 },
        ];

        // Isi data
        barangMaintenance.forEach((item, index) => {
            const d = item.toJSON();

            const tanggalMaintenance = d.tanggal_maintenance
                ? new Date(d.tanggal_maintenance).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const tanggalSelesai = d.tanggal_selesai
                ? new Date(d.tanggal_selesai).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })
                : '-';

            const dataRow = worksheet.addRow([
                index + 1,
                d.barang?.kode_barang ?? '-',
                d.barang?.name        ?? '-',
                d.jumlah_maintenance  ?? '-',
                tanggalMaintenance,
                tanggalSelesai,
                d.status              ?? '-',
                d.keterangan          ?? '-',
            ]);

            dataRow.height = 20;
            dataRow.eachCell((cell) => {
                cell.border    = rowBorder;
                cell.alignment = { vertical: 'middle' };
            });

            // Warna selang-seling
            if (index % 2 === 0) {
                dataRow.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8F0' } };
                });
            }

            // Warna status cell
            const statusCell = dataRow.getCell(7);
            if (d.status === 'selesai') {
                statusCell.font = { bold: true, color: { argb: 'FF155724' } };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
            } else {
                statusCell.font = { bold: true, color: { argb: 'FF856404' } };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
            }
        });

        // Baris total
        const totalRow = worksheet.addRow(['', '', 'Total', barangMaintenance.length, '', '', '', '']);
        totalRow.getCell(3).font = { bold: true };
        totalRow.getCell(4).font = { bold: true, color: { argb: 'FFE67E22' } };

        // Kirim response
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="laporan-barang-maintenance.xlsx"',
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