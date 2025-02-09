
// Importamos la función para ejecutar consultas en la base de datos
import { executeQuery } from "../db/models/queryModel";

// Obtener información de todos los productos con filtros //
export const getProductsByFilters = (req:any, res:any) => {
    // Extraemos los filtros desde los query parameters
    const {product_name, category, price, status } = req.body;
    
    // Validamos que se haya proporcionado al menos un filtro
    if (!product_name && !category && !price && !status) {
      return res.status(400).json({ error: "Al menos un filtro es obligatorio" });
    }
    // Construimos la consulta SQL para buscar productos con los filtros proporcionados
    let query = "SELECT * FROM product WHERE name_product LIKE ? AND category LIKE ? AND price >= ? AND status >= ?";
  
    executeQuery(query, [product_name, category, price, status], (err:any, results:any) => {
      if (err) {
        console.error("Error al obtener la información del producto:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
  
      // Si no se encuentran resultados, devolvemos un 404
      if (results.length === 0) {
        return res.status(404).json({ error: "Productos no encontrados" });
      }
  
      res.status(200).json({ productInfo: results });
    });
  };