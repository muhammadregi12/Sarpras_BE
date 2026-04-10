const e = require("express");
const Cabang = require("../models/cabangModels");

exports.getAllCabang = async (req, res) => {
    try {

        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const cabang = await Cabang.findAndCountAll({
            limit,
            offset,
        });

        return res.status(200).json({
            message: "Get All Cabang",
            data: cabang.rows,
            total: cabang.count,
            page,
            limit
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.getCabangById = async (req, res) => {
    try {

        const { id } = req.params;
        const cabang = await Cabang.findByPk(id);

        if (!cabang) {
            return res.status(404).json({
                message: "Cabang Not Found"
            })
        }

        return res.status(200).json({
            message: "Get Cabang By Id",
            data: cabang
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.createCabang = async (req, res) => {
    try {
        const { name_cabang, daerah_cabang } = req.body;
        if (!name_cabang || !daerah_cabang) {
            return res.status(400).json({
                message: "Name Cabang and Daerah Cabang are required"
            })
        }

        const cabang = await Cabang.create({
            name_cabang,
            daerah_cabang
        });

        return res.status(201).json({
            message: "Create Cabang",
            data: cabang
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.updateCabang = async (req, res) => {
    try {

        const { id } = req.params;
        const { name_cabang, daerah_cabang } = req.body;

        if (!name_cabang || !daerah_cabang) {
            return res.status(400).json({
                message: "Name Cabang and Daerah Cabang are required"
            })
        }

        const cabang = await Cabang.findByPk(id);

        if (!cabang) {
            return res.status(404).json({
                message: "Cabang Not Found"
            })
        }

        await cabang.update({
            name_cabang,
            daerah_cabang
        });

        return res.status(200).json({
            message: "Update Cabang",
            data: cabang
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.deleteCabang = async (req, res) => {
    try {

        const { id } = req.params;
        const cabang = await Cabang.findByPk(id);
        if (!cabang) {
            return res.status(404).json({
                message: "Cabang Not Found"
            })
        }

        await cabang.destroy();

        return res.status(200).json({
            message: "Delete Cabang"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

