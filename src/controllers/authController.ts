import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import transporter from "../extra/mailController"; // Importamos el transporter
//importamos elementos necesarios
// Importa la biblioteca jsonwebtoken

const jwt = require("jsonwebtoken"); // Importa la biblioteca jsonwebtoken
import db from "../db/dbConfig";

//importamos la clave secreta
import { secretKey } from "../token/authtoken";
import { executeQuery } from "../db/models/queryModel";


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



// recuperar contrasenas:

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

