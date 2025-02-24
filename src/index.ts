//importamos express
import express from "express";
//creamos la app
const app = express();

//importamos la liberia para realizar las peticiones
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
//configuracion de la app

//uso de cors
app.use(cors());
// // Analiza datos codificados en la URL
app.use(bodyParser.urlencoded({ extended: true }));
// Analiza el cuerpo de la solicitud como JSON
app.use(bodyParser.json());
//uso de ficheros
app.use(express.json());

//config de cors para permitir peticiones
const corsOptions = {
  origin: true, // Permite cualquier origen
  //origin: ['http://localhost:3000', 'https://frontend-re-wear.vercel.app/'],  // origenes reales
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas
};

// Middleware de CORS
app.use(cors(corsOptions));
//puerto
const PORT = process.env.PORT;

//importamos el direccionamiento de rutas:


import { login, register, resetPassword, updatePassword , googleAuth } from "./controllers/authController";
import { ping, getUsuarios } from "./controllers/othersController";
import { authenticateToken } from "./token/authtoken";
import { getProfileInfo, getUserProfileByUsername , getUserProfileById, getuseridByUsername} from "./controllers/profileController";
import { createProduct,updateProduct,deleteProduct,getAllProducts,getProductInfo, getProductsBySeller } from "./controllers/productController";
import { addToCart, removeFromCart, getCart } from "./controllers/cartController";
import {getProductsByName} from "./controllers/searchProducts";
import {getProductsByFilters} from "./controllers/productSearchFilter";
// con base al token obtenemos la info necesaria
const getProfileData = [authenticateToken, getProfileInfo];
const createProductData = [authenticateToken, createProduct];
const getProductData = [getProductInfo];
//configuramos las rutas con su debida funcion y metodo
//rutas de autenticacion de credenciales
app.post("/login", login);
app.post("/register", register);
app.post("/auth/google", googleAuth); // A

//-------------------------------------------------------------------------
// RECUPERACIÓN DE CONTRASEÑA
// Ruta para solicitar el envío del correo de recuperación (envía el token al email del usuario)
app.post("/forgot-password", resetPassword);
// Ruta para actualizar la contraseña una vez que el usuario envíe el nuevo password y el token
app.post("/update-password", updatePassword);

//-------------------------------------------------------------------------
//PRODUCTOS
// obtener informacion
app.get("/product/:product_id", getProductData, (req: any, res: any) => {
  res.json(req.body.productInfo);
});
// crear producto
app.post("/createProduct", createProductData);
//actualizar producto
app.put("/product/:id", authenticateToken, updateProduct);
// eliminar producto
app.delete("/product/:id", authenticateToken, deleteProduct);
// obtener producto por usuario
app.post("/productsuser", getProductsBySeller);
//-------------------------------------------------------------------------
//PERFIL
//rutas para el acceso de informacion del perfil
app.get("/perfil", getProfileData, (req: any, res: any) => {
  res.json(req.body.profileInfo[0]);
});
//perfilexterno
app.post("/perfilexterno", getUserProfileById);
//Obtener id de username
app.post("/idexterno", getuseridByUsername);
//perfilexterno general
app.get("/user/:username", getUserProfileByUsername);


//-------------------------------------------------------------------------
//BUSQUEDA DE PRODUCTOS
app.get("/search/:name", getProductsByName, (req: any, res: any) => {
  res.json(req.body.productInfo);
});
//ruta para buscar productos con filtros
app.post("/search/filter", getProductsByFilters);
//ruta para obtener todos los productos
app.get("/products", getAllProducts);
//saca la base de datos
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Importamos las rutas del carrito


// Rutas para el carrito de compras
// Agregar un producto al carrito
app.post("/cart/add", authenticateToken, addToCart);

// Eliminar un producto del carrito
app.delete("/cart/remove", authenticateToken, removeFromCart);

// Consultar el carrito del usuario
app.get("/cart", authenticateToken, getCart);

//-------------------------------------------------------------------------
//rutas de funcionalidades varias:
app.get("/ping", ping);
app.get("/usuarios", getUsuarios);
// Middleware para obtener la información del producto

