import nodemailer from "nodemailer";

// Configuración del transporter con Mailgun
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


<<<<<<< HEAD
export default transporter;
=======
export default transporter;
>>>>>>> 8e50a5c1efa41dd3847aa48187d9abeb5b02f6aa
