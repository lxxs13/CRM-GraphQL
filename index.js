const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolver');
const jwt = require('jsonwebtoken');
const conectarDB = require('./config/db');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

conectarDB();

//servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
        const token = req.headers['authorization'] || '';
        if (token) {
            try {
                const usuario = jwt.verify(token, process.env.SECRETA);
                return usuario
            } catch (error) {
                console.log("Error: ", error);

            }
        }
    }
});

//arrancar serrvidor
server.listen().then(({ url }) => {
    console.log(`Servidor listo en la URL ${url}`)
});
