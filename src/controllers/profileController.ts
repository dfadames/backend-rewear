import { executeQuery } from "../db/models/queryModel";

export const getProfileInfo = (req: any, res: any, next: any) => {
  console.log(req.user.id);
  const userId = req.user.id;

  const query = "SELECT * FROM user WHERE id = ?";
  
  executeQuery(query, [userId], (err: any, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length > 0) {
      req.body.profileInfo = results;
      next();
    } else {
      res.status(404).json({ message: "Perfil no encontrado" });
    }
  });
};


// para obtener un perfil
export const getUserProfileById = (req: any, res: any) => {
  // Extraemos el ID del usuario desde el cuerpo de la petición
  const { user_id } = req.body;

  // Validamos que el user_id esté presente
  if (!user_id) {
    return res.status(400).json({ error: "El ID del usuario es obligatorio" });
  }

  // Preparamos la consulta SQL para obtener la información del usuario específico
  const query = "SELECT username FROM user WHERE id = ?";

  // Ejecutamos la consulta pasando el ID del usuario
  executeQuery(query, [user_id], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener el perfil del usuario:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Devolvemos la información del usuario
    res.status(200).json(results[0]);
  });
};
// para obtener un perfil
export const getuseridByUsername = (req: any, res: any) => {
  // Extraemos el ID del usuario desde el cuerpo de la petición
  const { username } = req.body;

  // Validamos que el user_id esté presente
  if (!username) {
    return res.status(400).json({ error: "El username del usuario es obligatorio" });
  }

  // Preparamos la consulta SQL para obtener la información del usuario específico
  const query = "SELECT id FROM user WHERE username = ?";

  // Ejecutamos la consulta pasando el ID del usuario
  executeQuery(query, [username], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener el id del usuario:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Devolvemos la información del usuario
    res.status(200).json(results[0]);
  });
};


// para usuario externo
export const getUserProfileByUsername = (req: any, res: any) => {
  // Extraemos el nombre de usuario desde los parámetros de la URL
  const username = req.params.username;

  // Validamos que el username esté presente
  if (!username) {
    return res.status(400).json({ error: "El nombre de usuario es obligatorio" });
  }

  // Preparamos la consulta SQL para obtener la información del usuario por su username
  const query = "SELECT * FROM user WHERE username = ?";

  // Ejecutamos la consulta pasando el username
  executeQuery(query, [username], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener el perfil del usuario:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    // Obtenemos el perfil del usuario
    const userProfile = results[0];

    // Ahora, consultamos el promedio de reseñas para este vendedor
    const avgQuery = "SELECT AVG(rating) AS averageRating FROM reviews WHERE seller_id = ?";
    executeQuery(avgQuery, [userProfile.id], (err: any, avgResults: any) => {
      if (err) {
        console.error("Error al obtener promedio de reseñas:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }

      const averageRating = avgResults[0].averageRating || 0;

      // Consultamos la lista de reseñas (IDs de usuarios y comentarios) para este vendedor
      const listQuery = "SELECT user_id, comment FROM reviews WHERE seller_id = ?";
      executeQuery(listQuery, [userProfile.id], (err: any, reviewList: any) => {
        if (err) {
          console.error("Error al obtener reseñas:", err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }

        // Combinamos la información del perfil con las estadísticas de reseñas
        return res.status(200).json({
          ...userProfile,
          reviewStats: {
            averageRating,
            reviews: reviewList
          }
        });
      });
    });
  });
};