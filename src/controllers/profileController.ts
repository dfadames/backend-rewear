import { Request, Response } from "express";
import cloudinary from "cloudinary";
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


export const updateProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    if (!req.files || !req.files.image) {
      res.status(400).json({ error: "Debes subir una imagen de perfil." });
      return;
    }

    const imageFile = (req.files as any).image;
    // Subir la imagen a Cloudinary en la carpeta "rewear_profiles"
    const result = await cloudinary.v2.uploader.upload(imageFile.tempFilePath, {
      folder: "rewear_profiles",
    });
    const imageUrl = result.secure_url;

    // Actualizamos la base de datos usando el nombre correcto de la columna: image_perfil
    const updateQuery = "UPDATE user SET image_perfil = ? WHERE id = ?";
    executeQuery(updateQuery, [imageUrl, userId], (err: any, dbResults: any) => {
      if (err) {
        console.error("Error al actualizar la imagen en la base de datos:", err);
        res.status(500).json({ error: "Error interno del servidor" });
        return;
      }

      // Responde con la URL actualizada, usando el mismo nombre de columna
      res.status(200).json({
        message: "Imagen de perfil actualizada correctamente",
        image_perfil: imageUrl,
      });
    });
  } catch (error) {
    console.error("Error en updateProfileImage:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


export const getProfileImage = (req: Request, res: Response): void => {
  const userId = (req as any).user?.id;
  if (!userId) {
    res.status(400).json({ error: "No se encontró el ID del usuario" });
    return;
  }

  // Consulta para obtener la imagen de perfil usando el nombre correcto: image_perfil
  const query = "SELECT profile_perfil FROM user WHERE id = ?";

  executeQuery(query, [userId], (err: any, results: any) => {
    if (err) {
      console.error("Error al obtener la imagen de perfil:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    
    console.log("Resultado de la consulta:", results);
    
    if (!results || results.length === 0) {
      res.status(404).json({ error: "Perfil no encontrado" });
      return;
    }

    res.status(200).json({ image_perfil: results[0].image_perfil });
  });
};
