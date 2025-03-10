//importamos express
import express from "express";
//importamos cloudinary
import cloudinary from "cloudinary";
//importamos la libreria para subir archivos para imagenes
import fileUpload from "express-fileupload";
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
//configuracion de fileupload
app.use(fileUpload({
  useTempFiles: true, // Necesario para trabajar con Cloudinary
  tempFileDir: "/tmp/",
}));

//configuracion de cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,  
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Middleware de CORS
app.use(cors(corsOptions));
//puerto
const PORT = process.env.PORT;

//importamos el direccionamiento de rutas:
import { login, register, resetPassword, updatePassword, googleAuth , updatePasswordnormal } from "./controllers/authController";
import { updateProfileImage } from "./controllers/profileController";

import { ping, getUsuarios } from "./controllers/othersController";
import { authenticateToken } from "./token/authtoken";
import { getProfileInfo, getUserProfileByUsername, getUserProfileById, getuseridByUsername, deleteProfile } from "./controllers/profileController";
import { createProduct, updateProduct, deleteProduct, getAllProducts, getProductInfo, getProductsBySeller } from "./controllers/productController";
import { addToCart, removeFromCart, getCart } from "./controllers/cartController";
import { getProfileImage } from "./controllers/profileController";
import { getProductsByName } from "./controllers/searchProducts";
import { getProductsByFilters } from "./controllers/productSearchFilter";
import { createPaymentPreference, mpWebhook, paymentSuccess, paymentFailure, paymentPending, getPurchaseHistory } from "./controllers/checkoutController";
import { createReview, getReviewsByUsername, deleteReviews } from "./controllers/reviewController";
import { createUserReport, createProductReport } from "./controllers/reportController";
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
// Eliminar perfil
app.delete("/eliminarperfil", authenticateToken, deleteProfile);

app.put("/profile/image", authenticateToken, updateProfileImage);
app.get("/profile/image", authenticateToken, getProfileImage);
// Update password desde el perfil
app.put('/update-password-normal', async (req, res) => {
  await updatePasswordnormal(req, res);
});

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

//-------------------------------------------------------------------------
// CARRITO DE COMPRA
// Agregar un producto al carrito
app.post("/cart/add", authenticateToken, addToCart);

// Eliminar un producto del carrito
app.post("/cart/remove", authenticateToken, removeFromCart);

// Consultar el carrito del usuario
app.get("/cart", authenticateToken, getCart);
//-------------------------------------------------------------------------
// Review
app.post("/reviews/:sellerId", authenticateToken, createReview);
// Endpoint para obtener el promedio de calificaciones y comentarios por username
app.get("/reviews/:username", getReviewsByUsername);
app.delete("/reviews/:username", authenticateToken, deleteReviews);

//-------------------------------------------------------------------------
// RUTAS DE MERCADO PAGO
// Crear preferencia de pago
app.post("/payment/create_preference", createPaymentPreference);
// Webhook para notificaciones de Mercado Pago
app.post("/payment/webhook", mpWebhook);
// Redirecciones según el resultado del pago
app.get("/payment/success", paymentSuccess);
app.get("/payment/failure", paymentFailure);
app.get("/payment/pending", paymentPending);
//paiment 
app.get("/payment/history", authenticateToken, getPurchaseHistory);

//reportes
app.post("/report/user/",authenticateToken, createUserReport);
app.post("/report/product/",authenticateToken, createProductReport);

//-------------------------------------------------------------------------
//rutas de funcionalidades varias:
app.get("/ping", ping);
app.get("/usuarios", getUsuarios);
// Middleware para obtener la información del producto