import { executeQuery } from "../db/models/queryModel";

/**
 * Agrega un producto al carrito del usuario.
 * Si el producto ya existe, se actualiza la cantidad.
 */
export const addToCart = (req: any, res: any) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity) {
    return res.status(400).json({ error: "El ID del producto y la cantidad son obligatorios" });
  }

  // Primero, se verifica si el producto ya está en el carrito
  const checkQuery = "SELECT * FROM cart WHERE user_id = ? AND product_id = ?";
  executeQuery(checkQuery, [userId, productId], (err: any, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (results.length > 0) {
      // Si ya existe, se actualiza la cantidad sumándole la cantidad recibida
      const updateQuery = "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?";
      executeQuery(updateQuery, [quantity, userId, productId], (err: any, updateResult: any) => {
        if (err) {
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        return res.status(200).json({ message: "Producto actualizado en el carrito" });
      });
    } else {
      // Si no existe, se inserta el nuevo producto en el carrito
      const insertQuery = "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
      executeQuery(insertQuery, [userId, productId, quantity], (err: any, insertResult: any) => {
        if (err) {
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        return res.status(200).json({ message: "Producto agregado al carrito" });
      });
    }
  });
};

/**
 * Elimina un producto del carrito del usuario.
 */
export const removeFromCart = (req: any, res: any) => {
  const userId = req.user.id;
  const { productId } = req.body;
  
  if (!productId) {
    return res.status(400).json({ error: "El ID del producto es obligatorio" });
  }
  
  const deleteQuery = "DELETE FROM cart WHERE user_id = ? AND product_id = ?";
  executeQuery(deleteQuery, [userId, productId], (err: any, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    // Si no se eliminó ningún registro, el producto no existía en el carrito
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }
    res.status(200).json({ message: "Producto eliminado del carrito" });
  });
};

/**
 * Consulta el carrito del usuario.
 */
export const getCart = (req: any, res: any) => {
  const userId = req.user.id;
  
  const query = "SELECT * FROM cart WHERE user_id = ?";
  executeQuery(query, [userId], (err: any, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.status(200).json(results);
  });
};
