// Importamos la función para ejecutar consultas en la base de datos
import { executeQuery } from "../db/models/queryModel";


//Obtener información de un producto específico
export const getProductInfo = (req: any, res: any, next: any) => {
  // Extraemos el ID del producto desde los parámetros de la URL
  const { product_id } = req.params;

  // Validamos que el ID del producto haya sido proporcionado
  if (!product_id) {
    return res.status(400).json({ error: "El ID del producto es obligatorio" });
  }

  // Consulta SQL para obtener la información del producto
  const query = `
  SELECT 
    product.id as idproduct, 
    product.seller_id, 
    user.username, 
    name_product, 
    product.price, 
    product.description, 
    product.category, 
    product.status 
  FROM product 
  INNER JOIN user 
    ON user.id = product.seller_id 
  WHERE id = ?`;
  // Ejecutamos la consulta con `executeQuery`
  executeQuery(query, [product_id], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener la información del producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Verificamos si el producto existe
    if (results.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Almacenamos la información del producto en req.body y continuamos
    req.body.productInfo = results[0];
    next();
  });
};

// crear producto
export const createProduct = (req: any, res: any) => {

  // Extraemos los datos del cuerpo de la petición
  const { name_product, category, price, description, status, publication_status } = req.body;
  // Obtenemos el ID del vendedor desde el usuario autenticado
  const seller_id = req.user.id;
  // Formateamos la fecha actual en formato YYYY-MM-DD
  const publication_date = new Date().toISOString().slice(0, 10);
  // Asignamos un valor por defecto a publication_status si no se proporciona
  const pubStatus = publication_status || 'available';

  // Validamos que todos los campos requeridos estén presentes
  if (!name_product || !price || !category || !description || (status === undefined)) {
    return res.status(400).json({ error: "Todos los campos son obligatorios: name_product, price, category, description y status" });
  }

  // Preparamos la consulta SQL para insertar el nuevo producto, asociándolo al usuario
  const query = "INSERT INTO product (seller_id, name_product, category, price, description, status, publication_status, publication_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  // Ejecutamos la consulta pasando los parámetros
  executeQuery(query, [seller_id, name_product, category, price, description, status, pubStatus, publication_date], (err: any , results: any) => {
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
export const updateProduct = (req: any, res: any) => {
  const productId = req.params.id;
  const seller_id = req.user.id; // ID del usuario autenticado

  const { name_product, price, category, description, status, publication_status } = req.body;

  if (!name_product || !price || !category || !description || status === undefined) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios: name_product, price, category, description y status" 
    });
  }

  const pubStatus = publication_status || 'available';
  // verificamos prducto
  const checkQuery = "SELECT seller_id FROM product WHERE id = ?";
  
  executeQuery(checkQuery, [productId], (err: any, results: any) => {
    if (err) {
      console.error("Error al verificar el producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (results[0].seller_id !== seller_id) {
      return res.status(403).json({ error: "No tienes permiso para modificar este producto" });
    }

    // **Si el producto pertenece al usuario, procedemos con la actualización**
    const updateQuery = `
      UPDATE product 
      SET name_product = ?, category = ?, price = ?, description = ?, status = ?, publication_status = ?
      WHERE id = ? AND seller_id = ?
    `;

    executeQuery(updateQuery, [name_product, category, price, description, status, pubStatus, productId, seller_id], (err: any, results: any) => {
      if (err) {
        console.error("Error al actualizar el producto:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Producto no encontrado o no pertenece al usuario" });
      }

      res.status(200).json({ message: "Producto actualizado exitosamente" });
    });
  });
};


// Delete producto
export const deleteProduct = (req: any, res: any) => {
  const productId = req.params.id;
  const seller_id = req.user.id; // ID del usuario autenticado

  //verificar existencia y correlacion con el usuario
  const checkQuery = "SELECT seller_id FROM product WHERE id = ?";

  executeQuery(checkQuery, [productId], (err: any, results: any) => {
    if (err) {
      console.error("Error al verificar el producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (results[0].seller_id !== seller_id) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este producto" });
    }

    // eliminar
    const deleteQuery = "DELETE FROM product WHERE id = ? AND seller_id = ?";

    executeQuery(deleteQuery, [productId, seller_id], (err: any, results: any) => {
      if (err) {
        console.error("Error al eliminar el producto:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      res.status(200).json({ message: "Producto eliminado exitosamente" });
    });
  });
};

// obtenemos prouctos de un vendedor
export const getProductsBySeller = (req: any, res: any) => {
  // Extraemos el ID del vendedor desde el cuerpo de la petición
  const { seller_id } = req.body;

  // Validamos que el seller_id esté presente
  if (!seller_id) {
    return res.status(400).json({ error: "El ID del vendedor es obligatorio" });
  }

  // Preparamos la consulta SQL para obtener los productos del vendedor específico
  const query = "SELECT * FROM product WHERE seller_id = ?";

  // Ejecutamos la consulta pasando el ID del vendedor
  executeQuery(query, [seller_id], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener los productos del vendedor:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Devolvemos los resultados obtenidos
    res.status(200).json(results);
  });
};

// Get all productos
export const getAllProducts = (req: any, res: any) => {
  // Preparamos la consulta SQL para obtener todos los productos
  const query = "SELECT * FROM product";

  // Ejecutamos la consulta
  executeQuery(query, [], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener los productos:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Devolvemos los resultados obtenidos
    res.status(200).json(results);
  });
};
