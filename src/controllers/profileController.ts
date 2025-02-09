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

    // Devolvemos la información del usuario
    res.status(200).json(results[0]);
  });
};