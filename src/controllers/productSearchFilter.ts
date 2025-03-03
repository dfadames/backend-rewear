import { Request, Response } from "express";
import { executeQuery } from "../db/models/queryModel";

export const getProductsByFilters = (req: Request, res: Response) => {
  console.log("Request body:", req.body);
  const { name_product, category, price, status } = req.body;
  
  const filters = [];
  const params = [];
  
  if (name_product && name_product.trim() !== "") {
    filters.push("LOWER(name_product) LIKE ?");
    params.push(`%${name_product.toLowerCase()}%`);
  } else {
    filters.push("LOWER(name_product) LIKE ?");
    params.push("%");
  }
  
  if (category && category.trim() !== "") {
    filters.push("LOWER(category) LIKE ?");
    params.push(`%${category.toLowerCase()}%`);
  } else {
    filters.push("LOWER(category) LIKE ?");
    params.push("%");
  }
  
  if (price && price !== "0") {
    filters.push("price <= ?");
    params.push(price);
  }
  
  if (status && status !== "0") {
    filters.push("status >= ?");
    params.push(status);
  }
  
  const query = `
    SELECT * FROM product
    WHERE ${filters.join(" AND ")}
  `;
  
  console.log("Query:", query);
  console.log("Params:", params);
  
  executeQuery(query, params, (err: any, results: any) => {
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

