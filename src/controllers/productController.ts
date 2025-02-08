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
  const query = "SELECT * FROM product WHERE id = ?";

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
  // Extraemos el ID del producto desde los parámetros de la URL
  const productId = req.params.id;
  
  // Obtenemos el ID del vendedor (usuario autenticado)
  const seller_id = req.user.id;
  
  // Extraemos los datos actualizados del cuerpo de la petición
  const { name_product, price, category, description, status, publication_status } = req.body;
  
  // Validamos que todos los campos requeridos estén presentes
  if (!name_product || !price || !category || !description || status === undefined) {
    return res.status(400).json({ 
      error: "Todos los campos son obligatorios: name_product, price, category, description y status" 
    });
  }
  
  // Asignamos un valor por defecto a publication_status si no se proporciona
  const pubStatus = publication_status || 'available';

  // Preparamos la consulta SQL para actualizar el producto,
  // asegurándonos que el producto pertenezca al usuario (seller_id)
  const query = `
    UPDATE product 
    SET name_product = ?, category = ?, price = ?, description = ?, status = ?, publication_status = ?
    WHERE id = ? AND seller_id = ?
  `;
  
  // Ejecutamos la consulta pasando los parámetros correspondientes
  executeQuery(query, [name_product, category, price, description, status, pubStatus, productId, seller_id], (err: any, results : any) => {
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
export const deleteProduct = (req: any, res: any) => {
  // Extraemos el ID del producto desde los parámetros de la URL
  const productId = req.params.id;

  // Obtenemos el ID del vendedor (usuario autenticado)
  const seller_id = req.user.id;

  // Preparamos la consulta SQL para eliminar el producto, comprobando que pertenezca al usuario
  const query = "DELETE FROM product WHERE id = ? AND seller_id = ?";

  // Ejecutamos la consulta pasando el ID del producto y el seller_id
  executeQuery(query, [productId, seller_id], (err: any, results: any) => {
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
