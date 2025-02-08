import { Request, Response } from "express";
import bcrypt from "bcrypt";
//importamos elementos necesarios
// Importa la biblioteca jsonwebtoken

const jwt = require("jsonwebtoken"); // Importa la biblioteca jsonwebtoken
import db from "../db/dbConfig";

//importamos la clave secreta
import { secretKey } from "../token/authtoken";
import { executeQuery } from "../db/models/queryModel";

//se realiza una peticion post que recibe contraseña y usuario y devuelve un token de sesion
export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Consulta para obtener el usuario por su nombre de usuario
  const query = "SELECT * FROM user WHERE username = ?";

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

//se realiza una peticion para insertar datos en la base de datos
export const register = async (req: Request, res: Response) => {
  const {email,username,password} = req.body;

  try {
    // Genera una sal y hashea la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const registration_date = new Date();
    const query =
      "INSERT INTO user (email,username,password) VALUES (?, ?, ?)";

    executeQuery(query, [registration_date,email, hashedPassword], (err: Error) => {
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

