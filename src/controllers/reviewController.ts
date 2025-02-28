// src/controllers/reviewController.ts
import { executeQuery } from "../db/models/queryModel";

export const createReview = (req: any, res: any) => {
    // Suponiendo que la ruta es: POST /reviews/:productId
    const productId = req.params.productId;
    const userId = req.user.id; // Se obtiene desde el middleware de autenticación
    const { rating, comment } = req.body;
  
    // Validamos que se proporcionen los datos necesarios
    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
  
    // Validamos que el rating esté en el rango correcto
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "El rating debe estar entre 1 y 5 estrellas" });
    }
  
    // Obtenemos la fecha actual en formato YYYY-MM-DD
    const comment_date = new Date().toISOString().slice(0, 10);
  
    // Construimos la consulta SQL para insertar la reseña, incluyendo comment_date
    const query = `
      INSERT INTO reviews (product_id, user_id, rating, comment, comment_date)
      VALUES (?, ?, ?, ?, ?)
    `;
  
    // Ejecutamos la consulta para insertar la reseña
    executeQuery(query, [productId, userId, rating, comment, comment_date], (err: any, results: any) => {
      if (err) {
        console.error("Error al insertar la reseña:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      res.status(201).json({ message: "Reseña creada exitosamente" });
    });
  };  

// Obtener reseñas de un producto
export const getReviewsByProduct = (req:any, res:any) => {
    const productId = req.params.productId;

    // Construimos la consulta SQL para obtener las reseñas de un producto
    const query = `
        SELECT * FROM reviews
        WHERE product_id = ?
    `;

    // Ejecutamos la consulta para obtener las reseñas del producto
    executeQuery(query, [productId], (err:any, results:any) => {
        if (err) {
            console.error("Error al obtener las reseñas:", err);
            return res.status(500).json({ error: "Error interno del servidor" });
        }

        res.status(200).json(results);
    });
}

// 