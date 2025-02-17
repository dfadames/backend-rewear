import { Request, Response, NextFunction, RequestHandler } from "express";
import bcrypt from "bcrypt";
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
  const {first_name, last_names, phone, username,email,password} = req.body;

  try {
    // Genera una sal y hashea la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const registration_date = new Date();
    const query =
      "INSERT INTO user (first_name, last_names, phone, username, email, password, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?)";

    executeQuery(query, [first_name, last_names, phone,username,email, hashedPassword,registration_date], (err: Error) => {
      if (err) {
        const errorMessage = "" + err;
        if (errorMessage.includes("Duplicate")) {
          res
            .status(400)
            .json({ error: "Este usuario y/o email ya está registrado" });
        } else {
          console.error("Error en la consulta SQL: " + err);
          res.status(500).json({ error: "Error interno del servidor" });
        }
      } else {
        console.log("Usuario creado: " + username);
        const user = { username: username};
        const token = jwt.sign(user, secretKey);
        res.status(200).json({ token });
      }
    });
  } catch (error) {
    console.error("Error al hashear la contraseña: ", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

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