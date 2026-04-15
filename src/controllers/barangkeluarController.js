const BarangKeluar = require("../models/barangkeluarModels");
const Barang = require("../models/barangModels");
const Cabang = require("../models/cabangModels");
const User = require("../models/userModels");

exports.getAllBarangKeluar = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const barangKeluar = await BarangKeluar.findAndCountAll({
            attributes: ["id", "jumlah", "tanggal_keluar", "keterangan"],
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
        
        const { barang_id, user_id, cabang_id, jumlah_keluar, tanggal_keluar, keterangan } = req.body;

        if(!barang_id || !cabang_id || !jumlah_keluar || !tanggal_keluar) {
            return res.status(400).json({
                message: "Barang Id, Cabang Id, Jumlah Keluar, dan Tanggal Keluar harus diisi"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        if (!updateJumlahBarang) {
            return res.status(404).json({
                message: "Barang Not Found"
            });
        }

        const barangKeluar = await BarangKeluar.create({
            barang_id,
            user_id,
            cabang_id,
            jumlah_keluar,
            tanggal_keluar,
            keterangan
        })

        if (updateJumlahBarang) {
            const newJumlah = updateJumlahBarang.jumlah - jumlah_keluar;
            if (newJumlah < 0) {
                return res.status(400).json({
                    message: "Jumlah Keluar melebihi jumlah barang yang tersedia"
                });
            }
        }

        updateJumlahBarang.jumlah -= jumlah_keluar;
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
        const { barang_id, user_id, cabang_id, jumlah_keluar, tanggal_keluar, keterangan } = req.body;
        const barangKeluar = await BarangKeluar.findByPk(id);

        if (!barangKeluar) {
            return res.status(404).json({
                message: "Barang Keluar Not Found"
            });
        }

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        if (!updateJumlahBarang) {
            return res.status(404).json({
                message: "Barang Not Found"
            });
        }

        if (updateJumlahBarang.jumlah < 0) {
            return res.status(400).json({
                message: "Jumlah Keluar melebihi jumlah barang yang tersedia"
            });
        }

        const jumlahKeluarSebelumnya = barangKeluar.jumlah_keluar;
        const selisihJumlah = jumlah_keluar - jumlahKeluarSebelumnya;

        updateJumlahBarang.jumlah -= selisihJumlah;
        await updateJumlahBarang.save();

        const updatedBarangKeluar = await barangKeluar.update({
            barang_id,
            user_id,
            cabang_id,
            jumlah_keluar,
            tanggal_keluar,
            keterangan
        });


        return res.status(200).json({
            message: "update barang keluar",
            data: updatedBarangKeluar
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}


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
            updateJumlahBarang.jumlah += barangKeluar.jumlah_keluar;
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
