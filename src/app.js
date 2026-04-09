require('dotenv').config()

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express()

// routes
const routes = require('./routes/authRoutes');

// cors
app.use(cors({
    origin: "http://localhost:1076",
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// src/upload
app.use("/public", express.static(path.join(__dirname, "..", "public")));

// routes
app.use("/api", routes);

app.get('/', (req, res) => {
    res.send('Hallo Developer')
})

module.exports = app