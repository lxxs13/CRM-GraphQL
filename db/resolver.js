const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;

    return jwt.sign({ id, nombre, apellido, email }, secreta, { expiresIn });
}

const resolvers = {
    Query: {
        obtenerUsuario: async (_, { token }) => {
            const usurioID = await jwt.verify(token, process.env.SECRETA);
            return usurioID;
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_, { id }) => {
            const producto = await Producto.findById(id);

            if (!producto)
                throw new Error("Producto no encontrado");

            return producto;
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async (_, { }, ctx) => {
            try {
                const clientes = await Cliente.find({ vendedor: ctx.id });
                return clientes
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async (_, { id }, ctx) => {
            const cliente = await Cliente.findById(id);

            if (!cliente)
                throw new Error("Cliente no encontrado");

            if (cliente.vendedor.toString() !== ctx.id)
                throw new Error("No tienes las credenciales");

            return cliente

        }
    },
    Mutation: {
        //#region Usuario
        nuevoUsuario: async (_, { input }) => {
            const { email, password } = input;

            //revisar si el usuario ya esta registrado
            const existeUsuario = await Usuario.findOne({ email });

            if (existeUsuario)
                throw new Error('El usuario ya está registrado');

            //Hashear el psw
            const salt = bcryptjs.genSaltSync(10);
            input.password = bcryptjs.hashSync(password, salt);

            //guardarlo en BD
            try {
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.error("Error al guardar usuario:", error);
                throw new Error("Error al crear usuario");
            }

        },
        autenticarUsuario: async (_, { input }) => {
            const { email, password } = input;

            const existeUsuario = await Usuario.findOne({ email });

            if (!existeUsuario)
                throw new Error('El usuario no existe');

            const passwordCorrecto = bcryptjs.compareSync(password, existeUsuario.password);

            if (!passwordCorrecto)
                throw new Error('El password es incorrecto');

            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }

        },
        //#endregion USUARIO

        //#region Producto
        nuevoProducto: async (_, { input }) => {
            try {
                const producto = new Producto(input);
                const resultado = await producto.save();
                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async (_, { id, input }) => {
            let producto = await Producto.findById(id);

            if (!producto)
                throw new Error("Producto no encontrado");

            producto = await Producto.findOneAndUpdate({ _id: id }, input, { new: true });
            return producto;
        },
        eliminarProducto: async (_, { id }) => {
            let producto = await Producto.findById(id);

            if (!producto)
                throw new Error("Producto no encontrado");

            await Producto.findOneAndDelete({ _id: id });

            return "Producto eliminado";
        },
        //#endregion

        //#region Clientes
        nuevoCliente: async (_, { input }, ctx) => {
            const { email } = input;
            const cliente = await Cliente.findOne({ email })

            if (cliente)
                throw new Error("El cliente ya se encuentra registrado");

            try {
                const nuevoCliente = new Cliente(input);
                nuevoCliente.vendedor = ctx.id;
                const resultado = await nuevoCliente.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarCliente: async (_, { id, input }, ctx) => {
            let cliente = await Cliente.findById(id);

            if (!cliente)
                throw new Error("El cliente no existe");

            if (cliente.vendedor.toString() !== ctx.id)
                throw new Error("No tienes las credenciales");

            cliente = await Cliente.findOneAndUpdate({ _id: id }, input, { new: true });
            return cliente;
        },
        eliminarCliente: async (_, { id }, ctx) => {
            let cliente = await Cliente.findById(id);

            if (!cliente)
                throw new Error("El cliente no existe");

            if (cliente.vendedor.toString() !== ctx.id)
                throw new Error("No tienes las credenciales");

            await Cliente.findOneAndDelete({ id: id });
            return "Cliente eliminado";
        },
        //#endregion
        //#region Pedido
        nuevoPedido: async (_, { input }, ctx) => {
            const { cliente } = input;
            let clienteExiste = await Cliente.findById(cliente);

            if (!clienteExiste)
                throw new Error("El cliente no existe");

            if (clienteExiste.vendedor.toString() !== ctx.id)
                throw new Error("No tienes las credenciales");

        }
        //#endRegion

    }
}


module.exports = resolvers;
