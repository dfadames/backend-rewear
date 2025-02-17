// Importamos la función para ejecutar consultas en la base de datos
import { executeQuery } from "../db/models/queryModel";

// Obtener información de todos los productos con filtros //
export const getProductsByFilters = (req:any, res:any) => {
    // Extraemos los filtros desde los query parameters
    const {category, price, status } = req.body; //toca cambiar esta vuelta a query
    
    // Validamos que se haya proporcionado al menos un filtro
    if (!category && !price && !status) {
      return res.status(400).json({ error: "Al menos un filtro es obligatorio" });
    }
    
    // Preparamos los filtros para usar en la consulta
    // Si se proporciona category, se usan comodines para búsquedas parciales.
    const searchCategory = category ? `%${category}%` : '%%';
    // Para price y status, asumimos que se buscan productos con precio mayor o igual al valor dado
    // y status mayor o igual al valor dado.
    // Si no se proporcionan, se puede usar un valor por defecto (por ejemplo, 0)
    const filterPrice = price ? price : 0;
    const filterStatus = status ? status : 0;
    // Construimos la consulta SQL con los filtros
    const query = `
      SELECT * FROM product 
      WHERE category LIKE ? 
      AND price <= ? 
      AND status >= ?
    `;
  
    // Ejecutamos la consulta con los filtros
    executeQuery(query, [searchCategory, filterPrice, filterStatus], (err:any, results:any) => {
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
