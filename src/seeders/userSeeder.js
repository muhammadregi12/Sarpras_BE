const User = require("../models/userModels");

async function userSeeder() {
    const count = await User.count();
        if (count === 0) {
            await User.bulkCreate([
                {
                    name: "Admin",
                    email: "admin@example.com",
                    password: bcrypt.hashSync("admin123", 8),
                    role: "admin",
                    image: "https://res.cloudinary.com/dzj8q3l6u/image/upload/v1700000000/default-profile.png"
                },
                {
                    name: "User",
                    email: "user@example.com",
                    password: bcrypt.hashSync("user123", 8),
                    role: "user",
                    image: "https://res.cloudinary.com/dzj8q3l6u/image/upload/v1700000000/default-profile.png"
                },
                {
                    name: "Operator",
                    email: "operator@example.com",
                    password: bcrypt.hashSync("operator123", 8),
                    role: "operator",
                    image: "https://res.cloudinary.com/dzj8q3l6u/image/upload/v1700000000/default-profile.png"
                },
                {
                    name: "Pimpinan",
                    email: "pimpinan@example.com",
                    password: bcrypt.hashSync("pimpinan123", 8),
                    role: "pimpinan",
                    image: "https://res.cloudinary.com/dzj8q3l6u/image/upload/v1700000000/default-profile.png"
                }
            ]);
        }
}

module.exports = userSeeder;