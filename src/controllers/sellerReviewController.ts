import { Request, Response } from "express";
import { executeQuery } from "../db/models/queryModel";

// Extend the Express Request type to include the "user" property
interface CustomRequest extends Request {
  user?: { id: number; [key: string]: any }; // Adjust properties as needed
}

export const getUserReviewStats = (req: CustomRequest, res: Response): Response | void => {
  // Get the seller ID from the token (req.user)
  const sellerId = req.user?.id;
  if (!sellerId) {
    return res.status(400).json({ error: "No se encontró el ID del usuario autenticado" });
  }

  // Query to get the average rating for this seller
  const avgQuery = "SELECT AVG(rating) AS averageRating FROM reviews WHERE seller_id = ?";
  executeQuery(avgQuery, [sellerId], (err: any, avgResults: any) => {
    if (err) {
      console.error("Error al obtener promedio de reseñas:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    // If there are no reviews, averageRating defaults to 0
    const averageRating = avgResults && avgResults[0] && avgResults[0].averageRating 
      ? avgResults[0].averageRating 
      : 0;

    // Query to get the list of reviews (user_id and comment) for this seller
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
