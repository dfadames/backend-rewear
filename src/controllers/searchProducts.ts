// Importamos la función para ejecutar consultas en la base de datos
import { executeQuery } from "../db/models/queryModel";

// Obtener la información de varios productos por su nombre (usando query parameters)
export const getProductsByName = (req:any, res:any) => {
  // Extraemos el nombre del producto desde los query parameters
  const { product_name } = req.body;

  // Validamos que se haya proporcionado el nombre del producto
  if (!product_name) {
    return res.status(400).json({ error: "El nombre del producto es obligatorio" });
  }

  // Construimos la consulta SQL para buscar productos cuyo nombre contenga la cadena proporcionada
  const query = "SELECT * FROM product WHERE name_product LIKE ?";
  const searchName = `%${product_name}%`;

  // Ejecutamos la consulta
  executeQuery(query, [searchName], (err:any, results:any) => {
    if (err) {
      console.error("Error al obtener la información del producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Si no se encuentran resultados, devolvemos un 404
    if (results.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({ productInfo: results });
  });
};