import { executeQuery } from "../db/models/queryModel";

export const createReview = (req: any, res: any) => {
  // Se espera que en el body se envíen: productId, rating y comment.
  // Opcionalmente, se puede enviar sellerId para validar que el producto pertenezca a ese vendedor.
  const { productId, rating, comment, sellerId: providedSellerId } = req.body;
  const buyerId = req.user.id; // Usuario autenticado (comprador)

  // Validación de datos obligatorios
  if (!productId || !rating || !comment) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  // Validación del rango del rating
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "El rating debe estar entre 1 y 5 estrellas" });
  }

  // Obtenemos la fecha actual en formato YYYY-MM-DD
  const comment_date = new Date().toISOString().slice(0, 10);

  // Consultamos el producto para obtener el seller_id y verificar si ya fue calificado
  const queryProduct = "SELECT seller_id, is_rated FROM product WHERE id = ?";
  executeQuery(queryProduct, [productId], (err: any, productResults: any) => {
    if (err) {
      console.error("Error al obtener el producto:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (productResults.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const { seller_id, is_rated } = productResults[0];

    // Verificamos que el producto no haya sido calificado ya
    if (is_rated) {
      return res.status(400).json({ error: "El producto ya ha sido calificado" });
    }

    // Si se envía un sellerId, validamos que coincida con el seller_id del producto
    if (providedSellerId && providedSellerId !== seller_id) {
      return res.status(400).json({ error: "El producto no pertenece al vendedor indicado" });
    }

    // Insertamos la reseña
    // Orden de columnas: seller_id, user_id, product_id, comment, rating, comment_date
    const queryReview = `
      INSERT INTO reviews (seller_id, user_id, product_id, comment, rating, comment_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    executeQuery(
      queryReview,
      [seller_id, buyerId, productId, comment, rating, comment_date],
      (err: any, reviewResults: any) => {
        if (err) {
          console.error("Error al insertar la reseña:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }

        // Actualizamos el producto para marcarlo como calificado (usamos 1 en lugar de true)
        const queryUpdateProduct = "UPDATE product SET is_rated = 1 WHERE id = ?";
        executeQuery(queryUpdateProduct, [productId], (err: any, updateResults: any) => {
          if (err) {
            console.error("Error al actualizar el producto:", err);
            return res.status(500).json({ error: "Error interno del servidor" });
          }
          res.status(201).json({ message: "Reseña creada exitosamente" });
        });
      }
    );
  });
};





export const getReviewsByUsername = (req: any, res: any) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ error: "El username es obligatorio" });
  }

  // Primero, obtenemos el id del usuario (vendedor) a partir del username
  const queryUser = "SELECT id FROM user WHERE username = ?";
  executeQuery(queryUser, [username], (err: any, userResults: any) => {
    if (err) {
      console.error("Error al obtener el usuario:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    if (userResults.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const sellerId = userResults[0].id;

    // Ahora, obtenemos las reseñas asociadas a ese vendedor
    const queryReviews = "SELECT user_id, comment, rating FROM reviews WHERE seller_id = ?";
    executeQuery(queryReviews, [sellerId], (err: any, reviewResults: any) => {
      if (err) {
        console.error("Error al obtener las reseñas:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      // Calculamos el promedio de calificaciones
      let averageRating = 0;
      if (reviewResults.length > 0) {
        const sum = reviewResults.reduce((acc: number, review: any) => acc + review.rating, 0);
        averageRating = sum / reviewResults.length;
      }

      // Preparamos la respuesta con el promedio y los comentarios (con id de usuario)
      res.status(200).json({
        averageRating,
        reviews: reviewResults.map((review: any) => ({
          user_id: review.user_id,
          comment: review.comment
        }))
      });
    });
  });
};

//delete all reviews from a user
export const deleteReviews = (req: any, res: any) => {
  const userId = req.user.id;

  const query = "DELETE FROM reviews WHERE user_id = ?";
  executeQuery(query, [userId], (err: any, results: any) => {
    if (err) {
      console.error("Error al eliminar las reseñas:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
    res.status(200).json({ message: "Reseñas eliminadas exitosamente" });
  });
}