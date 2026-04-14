const Ruangan = require('../models/ruanganModels');
const { Op } = require('sequelize');

exports.getAllRuangan = async (req, res) => {
    try {

        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const ruangan = await Ruangan.findAndCountAll({
            limit,
            offset,
        });

        return res.status(200).json({
            message: "Get All Ruangan",
            data: ruangan.rows,
            total: ruangan.count,
            page,
            limit
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.getRuanganById = async (req, res) => {
    try {
        
        const { id } = req.params;
        const ruangan = await Ruangan.findByPk(id);

        if (!ruangan) {
            return res.status(404).json({
                message: "Ruangan Not Found"
            })
        }

        return res.status(200).json({
            message: "Get Ruangan By Id",
            data: ruangan
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.createRuangan = async (req, res) => {
    try {
        
        const {kode_ruangan, name_ruangan} = req.body;
        if (!kode_ruangan || !name_ruangan) {
            return res.status(400).json({
                message: "Kode Ruangan and Name Ruangan are required"
            })
        }

        const existingRuangan = await Ruangan.findOne({
            where: {
                kode_ruangan
            }
        })

        if (existingRuangan) {
            return res.status(400).json({
                message: "Ruangan with this kode_ruangan already exists"
            })
        }

        const newRuangan = await Ruangan.create({
            kode_ruangan,
            name_ruangan
        })

        return res.status(201).json({
            message: "Create Ruangan berhasil",
            data: newRuangan
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}

exports.updateRuangan = async (req, res) => {
    try {
        
        const { id } = req.params;
        const {kode_ruangan, name_ruangan} = req.body;
        if (!kode_ruangan || !name_ruangan) {
            return res.status(400).json({
                message: "Kode Ruangan and Name Ruangan are required"
            })
        }

        const ruangan = await Ruangan.findByPk(id);
        if (!ruangan) {
            return res.status(404).json({
                message: "Ruangan Not Found"
            })
        }

        const existingRuangan = await Ruangan.findOne({
            where: {
                kode_ruangan,
                id: {
                    [Op.ne]: id
                }
            }
        })

        if (existingRuangan) {
            return res.status(400).json({
                message: "Ruangan with this kode_ruangan already exists"
            })
        }

        const updatedRuangan = await ruangan.update({
            kode_ruangan,
            name_ruangan
        })

        return res.status(200).json({
            message: "Update Ruangan",
            data: updatedRuangan
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        })
    }
}

exports.deleteRuangan = async (req, res) => {
    try {
        
        const { id } = req.params;
        const ruangan = await Ruangan.findByPk(id);
        if (!ruangan) {
            return res.status(404).json({
                message: "Ruangan Not Found"
            })
        }

        await ruangan.destroy();

        return res.status(200).json({
            message: "Delete Ruangan",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}