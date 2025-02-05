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



// Update producto

export const updateProduct = (req, res) => {
  // Extraemos el ID del producto desde los parámetros de la URL
  const productId = req.params.id;
  
  // Obtenemos el username del usuario autenticado
  const username = req.user.username;
  
  // Extraemos los datos actualizados del cuerpo de la petición
  const { nombre, precio, categoria, descripcion } = req.body;

  // Validamos que todos los campos requeridos estén presentes
  if (!nombre || !precio || !categoria || !descripcion) {
    return res.status(400).json({ error: "Todos los campos son obligatorios: nombre, precio, categoria y descripcion" });
  }

  // Preparamos la consulta SQL para actualizar el producto, asegurándonos que el producto pertenezca al usuario
  const query = "UPDATE productos SET nombre = ?, precio = ?, categoria = ?, descripcion = ? WHERE id = ? AND username = ?";

  // Ejecutamos la consulta con los parámetros, incluido el username
  executeQuery(query, [nombre, precio, categoria, descripcion, productId, username], (err, results) => {
    if (err) {
      console.error("Error al actualizar el producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Verificamos si se afectó alguna fila (si no, el producto no existe o no pertenece al usuario)
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado o no pertenece al usuario" });
    }

    res.status(200).json({ message: "Producto actualizado exitosamente" });
  });
};

// Delete producto

export const deleteProduct = (req, res) => {
  // Extraemos el ID del producto desde los parámetros de la URL
  const productId = req.params.id;
  
  // Obtenemos el username del usuario autenticado
  const username = req.user.username;

  // Preparamos la consulta SQL para eliminar el producto, comprobando que pertenezca al usuario
  const query = "DELETE FROM productos WHERE id = ? AND username = ?";

  //Ejecutamos la consulta pasando el ID y el username
  executeQuery(query, [productId, username], (err, results) => {
    if (err) {
      console.error("Error al eliminar el producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Verificamos si se afectó alguna fila (si no, el producto no existe o no pertenece al usuario)
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado o no pertenece al usuario" });
    }

    res.status(200).json({ message: "Producto eliminado exitosamente" });
  });
};
