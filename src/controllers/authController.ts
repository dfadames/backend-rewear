import { Request, Response, NextFunction, RequestHandler } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import transporter from "../extra/mailController"; // Importamos el transporter
//importamos elementos necesarios
// Importa la biblioteca jsonwebtoken

const jwt = require("jsonwebtoken"); // Importa la biblioteca jsonwebtoken
import db from "../db/dbConfig";
import { OAuth2Client } from "google-auth-library";
//importamos la clave secreta
import { secretKey } from "../token/authtoken";
import { executeQuery } from "../db/models/queryModel";
// google aotuh
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//LOGIN
//se realiza una peticion post que recibe contraseña y usuario y devuelve un token de sesion
export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Consulta para obtener el usuario por su nombre de usuario, en caso de contener un @ lo hace con el gmail
  const query = username.includes("@") 
  ? "SELECT * FROM user WHERE email = ?" 
  : "SELECT * FROM user WHERE username = ?";
  

  executeQuery(query, [username], async (err: Error, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    //si devuelve solo la consulta (1 parametro) la consulta eesta bien, de lo contrario no esta
    if (results.length != 1) {
      console.log(`Intento de login fallido: usuario no encontrado (${username})`);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const user = results[0];

    try {
      //Compara la contraseña proporcionada con la contraseña hasheada
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        console.log(`Intento de login fallido: contraseña incorrecta (${username})`);
        return res.status(401).json({ error: "Credenciales incorrectas" });
      }

      //Genera un token JWT si la contraseña es válida
      const token = jwt.sign({ username: user.username }, secretKey);
      console.log(`Intento de login exitoso: ${username}`);
      res.status(200).json({ token });
    } catch (error) {
      console.error("Error al verificar la contraseña: ", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });
};


//REGISTER
//se realiza una peticion para insertar datos en la base de datos
export const register = async (req: Request, res: Response) => {
  const { first_name, last_names, phone, username, email, password } = req.body;

  try {
    // Consulta previa para verificar si el usuario o email ya existen
    const checkQuery = "SELECT * FROM user WHERE username = ? OR email = ?";
    executeQuery(checkQuery, [username, email], async (err: Error, results: any) => {
      if (err) {
        console.error("Error al verificar usuario existente: " + err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      
      if (results && results.length > 0) {
        // Si se encuentra un usuario con ese username o email, se retorna un error
        return res.status(400).json({ error: "Este usuario y/o email ya está registrado" });
      }

      // Si no existe, se procede a hashear la contraseña y registrar el usuario
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const registration_date = new Date();
      const query = "INSERT INTO user (first_name, last_names, phone, username, email, password, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

      executeQuery(query, [first_name, last_names, phone, username, email, hashedPassword, registration_date], (err: Error) => {
        if (err) {
          console.error("Error en la consulta SQL: " + err);
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        console.log("Usuario creado: " + username);
        const user = { username: username };
        const token = jwt.sign(user, secretKey);
        return res.status(200).json({ token });
      });
    });
  } catch (error) {
    console.error("Error al procesar el registro: ", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};




// recuperar contrasenas:
// Función para ejecutar consultas de manera asíncrona
const queryAsync = (query: string, params: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    executeQuery(query, params, (err: Error, results: any) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Middleware de autenticación con Google
export const googleAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Falta el token de Google" });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({ error: "Token de Google inválido o sin email" });
      return;
    }

    const email = payload.email;
    const first_name = payload.given_name || "";
    const last_names = payload.family_name || "";
    const username = email.split("@")[0];
    const registration_date = new Date();

    try {
      // Verificar si el usuario ya existe
      const results = await queryAsync("SELECT * FROM user WHERE email = ?", [email]);

      let user: any;
      if (results.length > 0) {
        user = results[0]; // Usuario encontrado
      } else {
        // Insertar usuario si no existe
        const dummyPassword = "";
        await queryAsync(
          "INSERT INTO user (first_name, last_names, phone, username, email, password, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [first_name, last_names, "", username, email, dummyPassword, registration_date]
        );

        user = { username }; // Simular que el usuario fue creado
      }

      // Generar y enviar el token
      const jwtToken = jwt.sign({ username: user.username }, secretKey);
      res.status(200).json({ token: jwtToken });
    } catch (dbError) {
      console.error("Error en la base de datos:", dbError);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  } catch (authError) {
    console.error("Error al verificar token de Google:", authError);
    res.status(401).json({ error: "Token de Google inválido" });
  }
};

// Función para generar un token aleatorio
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Función de recuperación de contraseña
export const resetPassword = (req: Request, res: Response) => {
  const { email } = req.body;

  // Verificar si el usuario existe en la base de datos
  const query = "SELECT * FROM user WHERE email = ?";
  executeQuery(query, [email], async (err: Error, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length !== 1) {
      return res.status(404).json({ error: "El email no está registrado" });
    }

    const user = results[0];
    const resetToken = generateResetToken(); // Generamos un token único

    // Guardamos el token en la base de datos con una expiración (ejemplo: 1 hora)
    const updateQuery = "UPDATE user SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE email = ?";
    executeQuery(updateQuery, [resetToken, email], async (updateErr: Error) => {
      if (updateErr) {
        return res.status(500).json({ error: "Error al generar el token" });
      }

      // Enviar email con el link de recuperación
      const resetLink = `https://frontend-re-wear.vercel.app/actualizarcontrasena?token=${resetToken}`;
      await transporter.sendMail({
        from: '"rewear" <password@rewear.dadames.tech>',
        to: user.email,
        subject: "Recuperación de contraseña",
        text: `Hola ${user.username}, haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`,
      });

      console.log(`Correo de recuperación enviado a ${user.email}`);
      res.status(200).json({ message: "Correo de recuperación enviado" });
    });
  });
};


export const updatePassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Buscar el usuario con el token
  const query = "SELECT * FROM user WHERE reset_token = ? AND reset_token_expiry > NOW()";
  executeQuery(query, [token], async (err: Error, results: any) => {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (results.length !== 1) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const user = results[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña y eliminar el token
    const updateQuery = "UPDATE user SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?";
    executeQuery(updateQuery, [hashedPassword, user.email], (updateErr: Error) => {
      if (updateErr) {
        return res.status(500).json({ error: "Error al actualizar la contraseña" });
      }

      console.log(`Contraseña actualizada para ${user.email}`);
      res.status(200).json({ message: "Contraseña actualizada correctamente" });
    });
  });
};

export const updatePasswordnormal = async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token y nueva contraseña son obligatorios" });
  }

  try {
    const decoded: any = jwt.verify(token, secretKey);
    const email = decoded.username;

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    const updateQuery = "UPDATE user SET password = ? WHERE email = ?";
    executeQuery(updateQuery, [hashedPassword, email], (updateErr: Error) => {
      if (updateErr) {
        return res.status(500).json({ error: "Error al actualizar la contraseña" });
      }
      console.log(`Contraseña actualizada para ${email}`);
      res.status(200).json({ message: "Contraseña actualizada correctamente" });
    });
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
