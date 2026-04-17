const Barang = require("../models/barangModels");
const BarangRusak = require("../models/barangrusakModels");
const User = require("../models/userModels");

exports.getAllBarangRusak = async (req, res) => {
    try {
        
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const barangRusak = await BarangRusak.findAndCountAll({
            attributes: ["id", "jumlah_rusak", "tanggal_rusak", "keterangan"],
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
            message: "Get All Barang Rusak",
            data: barangRusak.rows,
            total: barangRusak.count,
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

exports.getBarangRusakById = async (req, res) => {
    try {
        
        const barangRusak = await BarangRusak.findByPk(req.params.id, {
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
            message: "Get Barang Rusak By Id",
            data: barangRusak
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.createBarangRusak = async (req, res) => {
    try {
        
        const { barang_id, jumlah_rusak, tingkat_kerusakan, tanggal_rusak, keterangan, user_id } = req.body;

        if (!barang_id || !jumlah_rusak || !tanggal_rusak || !tingkat_kerusakan) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Barang ID, Jumlah Rusak, Tanggal Rusak, Tingkat Rusak, dan User ID harus diisi"
            })
        }

        const barang = await Barang.findByPk(barang_id);
        if (!barang) {
            return res.status(404).json({
                message: "Barang Not Found"
            })
        }


        const newJumlahBarang = barang.jumlah - parseInt(jumlah_rusak);
        if (newJumlahBarang < 0) {
            return res.status(400).json({
                message: "Jumlah Rusak tidak boleh lebih besar dari jumlah barang yang tersedia"
            })
        }

        const createBarangRusak = await BarangRusak.create({
            barang_id,
            jumlah_rusak,
            tanggal_rusak,
            tingkat_kerusakan,
            keterangan,
            user_id: req.user.id
        })

        const updateJumlahBarang = await Barang.findByPk(barang_id);
        updateJumlahBarang.jumlah = newJumlahBarang;
        await updateJumlahBarang.save();

        return res.status(201).json({
            message: "Create Barang Rusak",
            data: createBarangRusak,
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.updateBarangRusak = async (req, res) => {
    try {
        const { barang_id, jumlah_rusak, tingkat_kerusakan, tanggal_rusak, keterangan } = req.body;

        if (!barang_id || !jumlah_rusak || !tanggal_rusak || !tingkat_kerusakan) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Barang ID, Jumlah Rusak, Tanggal Rusak, dan Tingkat Rusak harus diisi"
            });
        }

        const barangRusak = await BarangRusak.findByPk(req.params.id);
        if (!barangRusak) {
            return res.status(404).json({ message: "Barang Rusak Not Found" });
        }

        const oldBarangId = parseInt(barangRusak.barang_id);
        const newBarangId = parseInt(barang_id);
        const oldJumlahRusak = parseInt(barangRusak.jumlah_rusak);
        const newJumlahRusak = parseInt(jumlah_rusak);

        if (oldBarangId !== newBarangId) {
            const oldBarang = await Barang.findByPk(oldBarangId);
            if (oldBarang) {
                oldBarang.jumlah += oldJumlahRusak;
                await oldBarang.save();
            }

            const newBarang = await Barang.findByPk(newBarangId);
            if (!newBarang) {
                return res.status(404).json({ message: "Barang Not Found" });
            }

            if (newBarang.jumlah < newJumlahRusak) {
                return res.status(400).json({
                    message: "Jumlah Rusak tidak boleh lebih besar dari jumlah barang yang tersedia"
                });
            }

            newBarang.jumlah -= newJumlahRusak;
            await newBarang.save();

        } else {
            const barang = await Barang.findByPk(newBarangId);
            if (!barang) {
                return res.status(404).json({ message: "Barang Not Found" });
            }

            const stokAktual = barang.jumlah + oldJumlahRusak;

            if (stokAktual < newJumlahRusak) {
                return res.status(400).json({
                    message: "Jumlah Rusak tidak boleh lebih besar dari jumlah barang yang tersedia"
                });
            }

            barang.jumlah = stokAktual - newJumlahRusak;
            await barang.save();
        }

        const updatebarangRusak = await barangRusak.update({
            user_id: req.user.id,
            barang_id: newBarangId,
            jumlah_rusak: newJumlahRusak,
            tingkat_kerusakan,
            tanggal_rusak,
            keterangan
        });

        return res.status(200).json({
            message: "Update Barang Rusak",
            data: updatebarangRusak
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};

exports.deleteBarangRusak = async (req, res) => {
    try {
        
        const barangRusak = await BarangRusak.findByPk(req.params.id);
        if (!barangRusak) {
            return res.status(404).json({
                message: "Barang Rusak Not Found"
            })
        }

        const barang = await Barang.findByPk(barangRusak.barang_id);
        if (barang) {
            barang.jumlah += barangRusak.jumlah_rusak;
            await barang.save();
        }

        await barangRusak.destroy();

        return res.status(200).json({
            message: "Delete Barang Rusak",
        })
    
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}