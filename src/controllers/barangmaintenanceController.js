const BarangMaintenance = require("../models/barangmaintenanceModels");
const Barang = require("../models/barangModels");
const User = require("../models/userModels");

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
                }
            ],
            include: [
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
                }
            ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "name"]
                }
            ]
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