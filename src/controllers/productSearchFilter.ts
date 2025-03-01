import { Request, Response } from "express";
import { executeQuery } from "../db/models/queryModel";

export const getProductsByFilters = (req: Request, res: Response) => {
  console.log("Request body:", req.body);
  const { product_name, category, price, status } = req.body;

  // Usamos '%%' por defecto si no se proporciona product_name o category
  const searchProductName = product_name && product_name.trim() !== ""
    ? `%${product_name.toLowerCase()}%`
    : "%%";
  const searchCategory = category && category.trim() !== ""
    ? `%${category.toLowerCase()}%`
    : "%%";

  // Para price y status, usamos valores por defecto si no se proporcionan
  const filterPrice = price && price !== "0" ? price : 1000;
  const filterStatus = status && status !== "0" ? status : 10;

  const query = `
    SELECT * FROM product
    WHERE 1=1
      AND LOWER(name_product) LIKE ?
      AND LOWER(category) LIKE ?
      AND price <= ?
      AND status <= ?
  `;

  console.log("Query:", query);
  console.log("Params:", [searchProductName, searchCategory, filterPrice, filterStatus]);

  executeQuery(query, [searchProductName, searchCategory, filterPrice, filterStatus], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener los productos:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Productos no encontrados" });
    }
    res.status(200).json({ productInfo: results });
  });
};
