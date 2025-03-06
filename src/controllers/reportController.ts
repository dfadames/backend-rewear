import { Request, Response } from "express";
import { executeQuery } from "../db/models/queryModel";

export const createUserReport = async (req: any, res: any) => {
  // Verificar que el usuario esté autenticado
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }
  
  // Extraer el id del usuario que realiza el reporte desde el token
  const user_report_id = req.user.id;
  // Extraer los campos del reporte desde el cuerpo de la petición
  const { user_id_reported, category_report, comment } = req.body;

  if (!user_id_reported) {
    return res.status(400).json({ error: "Falta el campo obligatorio: user_id_reported" });
  }
  if (!category_report) {
    return res.status(400).json({ error: "Falta el campo obligatorio: category_report" });
  }
  if (!comment) {
    return res.status(400).json({ error: "Falta el campo obligatorio: comment" });
  }

  // Asignar la fecha actual en formato YYYY-MM-DD
  const publication_date = new Date().toISOString().slice(0, 10);

  // Si la tabla usa la columna 'user_id' en lugar de 'user_id_reported', modifica la consulta:
  const query = `
    INSERT INTO user_reports (user_report_id, user_id_reported, category_report, comment, publication_date)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  executeQuery(query, [user_report_id, user_id_reported, category_report, comment, publication_date], (err: any, results: any) => {
    if (err) {
      console.error("Error al crear el reporte al usuario:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    return res.status(201).json({ message: "Reporte creado exitosamente" });
  });
};

export const createProductReport = async (req: any, res: any) => {
    // Verificar que el usuario esté autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    
    // Extraer el id del usuario que realiza el reporte desde el token
    const user_report_id = req.user.id;
    // Obtener el id del producto reportado desde los parámetros (ruta: "/report/product/:productId")
    const {product_id_reported, category_report, comment } = req.body;
  
    if (!product_id_reported) {
      return res.status(400).json({ error: "Falta el campo obligatorio: product_id_reported" });
    }
    if (!category_report) {
      return res.status(400).json({ error: "Falta el campo obligatorio: category_report" });
    }
    if (!comment) {
      return res.status(400).json({ error: "Falta el campo obligatorio: comment" });
    }
  
    // Asignar la fecha actual en formato YYYY-MM-DD
    const publication_date = new Date().toISOString().slice(0, 10);
  
    // Consulta SQL para insertar el reporte en la tabla product_reports
    const query = `
      INSERT INTO product_reports 
        (user_report_id, product_id_reported, category_report, comment, publication_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    executeQuery(query, [user_report_id, product_id_reported, category_report, comment, publication_date], (err: any, results: any) => {
      if (err) {
        console.error("Error al crear el reporte al producto:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      return res.status(201).json({ message: "Reporte creado exitosamente" });
    });
  };