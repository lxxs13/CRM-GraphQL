const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO);
        console.log("DB conectada");
    } catch (error) {
        console.log("Hubo un error");
        console.log(error);
        process.exit(1); //detener la aplicacion
    }
}

module.exports = conectarDB;