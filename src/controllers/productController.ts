import cloudinary from "cloudinary";
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
    product.status,
    product.publication_status,
    product.publication_date,
    product.image_path
  FROM product 
  INNER JOIN user 
    ON user.id = product.seller_id 
  WHERE product.id = ?`;
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

export const createProduct = async (req: any, res: any) => {
  try {
    // Extraer datos del cuerpo de la petición
    const { name_product, category, price, description, status, publication_status, imageUrl } = req.body;
    const seller_id = req.user.id; // Se asume que el usuario autenticado está en req.user
    const publication_date = new Date().toISOString().slice(0, 10);
    const pubStatus = publication_status || 'available';

    // Validar que los campos obligatorios estén presentes
    if (!name_product || !price || !category || !description || status === undefined) {
      return res.status(400).json({ error: "Todos los campos son obligatorios: name_product, price, category, description y status" });
    }

    let finalImageUrl = imageUrl; // Se puede enviar en el body una URL ya subida

    // Si no se envió imageUrl y hay un archivo, se sube a Cloudinary
    if (!finalImageUrl) {
      if (!req.files || !req.files.image) {
        return res.status(400).json({ error: "Debes subir una imagen del producto." });
      }
  
      const imageFile = req.files.image;
      const result = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, {
        folder: "rewear_products", // Carpeta donde se guardarán las imágenes en Cloudinary
      });
      finalImageUrl = result.secure_url; // URL de la imagen en Cloudinary
    }

    // Preparamos la consulta SQL para insertar el nuevo producto, incluyendo la URL de la imagen
    const query = `
      INSERT INTO product 
      (seller_id, name_product, category, price, description, status, publication_status, publication_date, image_path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
  
    // Ejecutar la consulta en la base de datos
    executeQuery(
      query,
      [seller_id, name_product, category, price, description, status, pubStatus, publication_date, finalImageUrl],
      (err: any, results: any) => {
        if (err) {
          console.error("Error al crear el producto:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        res.status(201).json({
          message: "Producto creado exitosamente",
          productId: results.insertId,
          imageUrl: finalImageUrl,
        });
      }
    );
  } catch (error) {
    console.error("Error en createProduct:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


//actualizar producto
export const updateProduct = async (req: any, res: any) => {
  try {
    const productId = req.params.id;
    const seller_id = req.user.id;
    const { name_product, price, category, description, status, publication_status } = req.body;
    const pubStatus = publication_status || 'available';

    if (!name_product || !price || !category || !description || status === undefined) {
      return res.status(400).json({ 
        error: "Todos los campos son obligatorios: name_product, price, category, description y status" 
      });
    }

    // Verificar que el producto existe y pertenece al usuario
    const checkQuery = "SELECT seller_id FROM product WHERE id = ?";
    executeQuery(checkQuery, [productId], async (err: any, results: any) => {
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

      // Si se envía una nueva imagen, súbela a Cloudinary
      let imageUrl = null;
      if (req.files && req.files.image) {
        const imageFile = req.files.image;
        try {
          const result = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, {
            folder: "rewear_products",
          });
          imageUrl = result.secure_url;
        } catch (uploadErr) {
          console.error("Error al subir la nueva imagen:", uploadErr);
          return res.status(500).json({ error: "Error al subir la imagen" });
        }
      }

      // Construir la consulta de actualización
      let updateQuery = "";
      let params = [];
      if (imageUrl) {
        updateQuery = `
          UPDATE product
          SET name_product = ?, category = ?, price = ?, description = ?, status = ?, publication_status = ?, image_path = ?
          WHERE id = ? AND seller_id = ?
        `;
        params = [name_product, category, price, description, status, pubStatus, imageUrl, productId, seller_id];
      } else {
        updateQuery = `
          UPDATE product
          SET name_product = ?, category = ?, price = ?, description = ?, status = ?, publication_status = ?
          WHERE id = ? AND seller_id = ?
        `;
        params = [name_product, category, price, description, status, pubStatus, productId, seller_id];
      }

      executeQuery(updateQuery, params, (err: any, results: any) => {
        if (err) {
          console.error("Error al actualizar el producto:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Producto no encontrado o no pertenece al usuario" });
        }
        return res.status(200).json({ message: "Producto actualizado exitosamente" });
      });
    });
  } catch (error) {
    console.error("Error en updateProduct:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
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