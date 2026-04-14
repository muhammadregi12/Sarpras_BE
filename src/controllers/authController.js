const User = require("../models/userModels");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email dan password harus diisi"
            })
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                message: "User tidak ditemukan"
            })
        }

        // format email validasi
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Format email tidak valid"
            })
        }

        // validasi email 
        if (email !== user.email) {
            return res.status(401).json({
                message: "Email salah"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Password salah"
            })
        }

        const token = jwt.sign(
        { 
            id: user.id, role: user.role 
        }, 
            process.env.JWT_SECRET, 
        { 
            expiresIn:  process.env.JWT_EXPIRE || '1h' 
        });

        const userData = user.toJSON();
        delete userData.password;

        return res.status(200).json({
            message: "Login berhasil",
            data: userData,
            token: token
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

exports.logout = async (req, res) => {
    try {
        return res.status(200).json({
            message: "Logout berhasil"
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

exports.updateProfile = async (req, res) => {
    try {

        const { id } = req.user;
        const { name, email } = req.body;

        const user = await User.findByPk(id);
        if(!user){
            return res.status(404).json({
                message: "User tidak ditemukan"
            })
        }

        if (req.file && user.image) {
            const oldImage = path.join(user.image)
            if (fs.existsSync(oldImage)) {
                fs.unlinkSync(oldImage);
            }
        }

        const pathImage = req.file 
        ? req.file.path.replace(/\\/g, "/") 
        : user.image;


        const updateUser = await user.update({
            name: name || user.name,
            email: email || user.email,
            image: pathImage
        });

        return res.status(200).json({
            message: "Update profile berhasil",
            data: updateUser
        })

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

exports.updatePassword = async (req, res) => {
    try {
        const { id } = req.user;
        const { old_password, new_password, confirm_password } = req.body;

        const user = await User.findByPk(id);
        if(!user){
            return res.status(404).json({
                message: "User tidak ditemukan"
            })
        }

        if(!old_password || !new_password || !confirm_password){
            return res.status(400).json({
                message: "Semua field harus diisi"
            })
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({
                message: "Password dan konfirmasi password tidak cocok"
            })
        }

        const isMistach = await bcrypt.compare(old_password, user.password);
        if (!isMistach) {
            return res.status(401).json({
                message: "Password lama salah"
            })
        }

        const hashedPassword = await bcrypt.hash(new_password, 8);
        await user.update({ password: hashedPassword });

        return res.status(200).json({
            message: "Update password berhasil"
        })

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

exports.getProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    message: "User tidak ditemukan"
                })
            }
        const userData = user.toJSON();
        delete userData.password;
            return res.status(200).json({
                message: "Profile ditemukan",
                data: userData
            })
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}