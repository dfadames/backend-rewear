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

// para usuario externo
export const getUserProfileById = (req: any, res: any) => {
  // Extraemos el ID del usuario desde el cuerpo de la petición
  const { user_id } = req.body;

  // Validamos que el user_id esté presente
  if (!user_id) {
    return res.status(400).json({ error: "El ID del usuario es obligatorio" });
  }

  // Preparamos la consulta SQL para obtener la información del usuario específico
  const query = "SELECT * FROM user WHERE id = ?";

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