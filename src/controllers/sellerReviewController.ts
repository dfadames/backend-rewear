// src/controllers/sellerReviewController.ts
import { Request, Response } from "express";
import { executeQuery } from "../db/models/queryModel";

export const getUserReviewStats = (req: Request, res: Response): Response | void => {
  // Obtenemos el ID del vendedor desde el token (req.user)
  const sellerId = req.user?.id;
  if (!sellerId) {
    return res.status(400).json({ error: "No se encontró el ID del usuario autenticado" });
  }

  // Consulta para obtener el promedio de calificaciones (rating) para este vendedor
  const avgQuery = "SELECT AVG(rating) AS averageRating FROM reviews WHERE seller_id = ?";
  executeQuery(avgQuery, [sellerId], (err: any, avgResults: any) => {
    if (err) {
      console.error("Error al obtener promedio de reseñas:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    // Si no hay reseñas, averageRating se asigna a 0
    const averageRating = avgResults && avgResults[0] && avgResults[0].averageRating 
      ? avgResults[0].averageRating 
      : 0;

    // Consulta para obtener la lista de reseñas (user_id y comment) para este vendedor
    const listQuery = "SELECT user_id, comment FROM reviews WHERE seller_id = ?";
    executeQuery(listQuery, [sellerId], (err: any, reviewList: any) => {
      if (err) {
        console.error("Error al obtener lista de reseñas:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      return res.status(200).json({
        sellerId,
        reviewStats: {
          averageRating,
          reviews: reviewList || []
        }
      });
    });
  });
};
