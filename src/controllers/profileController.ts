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

    // Devolvemos la información del usuario
    res.status(200).json(results[0]);
  });
};

// Eliminar perfil.
export const deleteProfile = (req: any, res: any) => {
  // Retrieve the authenticated user's id from the request
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ error: "No se encontró el ID del usuario" });
  }

  // SQL query to delete the user from the 'user' table
  const query = "DELETE FROM user WHERE id = ?";

  executeQuery(query, [userId], (err: any, results: any) => {
    if (err) {
      console.error("Error al eliminar el perfil:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    // Check if a record was deleted (affectedRows should be > 0)
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Perfil no encontrado" });
    }

    // If the deletion was successful, send a success response
    res.status(200).json({ message: "Perfil eliminado exitosamente" });
  });
};