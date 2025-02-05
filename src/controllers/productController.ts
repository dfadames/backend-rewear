// Importamos la función para ejecutar consultas en la base de datos
import { executeQuery } from "../db/models/queryModel";

// crear producto



export const createProduct = (req, res) => {
  // Extraemos los datos del cuerpo de la petición
  const { nombre, precio, categoria, descripcion } = req.body;
  
  // Obtenemos el username del usuario autenticado, asumimos que el middleware authenticateToken lo inyecta en req.user
  const username = req.user.username;

  // Validamos que todos los campos requeridos estén presentes
  if (!nombre || !precio || !categoria || !descripcion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios: nombre, precio, categoria y descripcion" });
  }

  // Preparamos la consulta SQL para insertar el nuevo producto, asociándolo al usuario
  const query = "INSERT INTO productos (nombre, precio, categoria, descripcion, username) VALUES (?, ?, ?, ?, ?)";

  // Ejecutamos la consulta pasando los parámetros
  executeQuery(query, [nombre, precio, categoria, descripcion, username], (err, results) => {
    if (err) {
      console.error("Error al crear el producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Si la inserción es exitosa, devolvemos un estado 201 (creado) junto con el ID del nuevo producto
    res.status(201).json({
      message: "Producto creado exitosamente",
      productId: results.insertId, // Asegúrate de que results.insertId esté definido en tu implementación de executeQuery
    });
  });
};

