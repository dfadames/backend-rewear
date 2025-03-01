// paymentController.ts

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { executeQuery } from "../db/models/queryModel";

// Configuración de Mercado Pago utilizando el access token (idealmente almacenado en variables de entorno)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || "test" });
const preference = new Preference(client);

/**
 * Crea una preferencia de pago en Mercado Pago.
 * Se espera recibir en el body un array de items, donde cada item tiene:
 * - title: Título del producto.
 * - quantity: Cantidad del producto.
 * - unit_price: Precio unitario.
 */
export const createPaymentPreference = async (req: any, res: any) => {
  const { items } = req.body;
  
  // Validamos que se haya enviado un array de items y que no esté vacío
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "La lista de items es obligatoria y no puede estar vacía" });
  }
  
  // Validamos que cada item tenga los campos requeridos
  for (const item of items) {
    if (!item.title || !item.quantity || !item.unit_price) {
      return res.status(400).json({ error: "Cada item debe tener title, quantity y unit_price" });
    }
  }
  
  try {
    const response = await preference.create({
      body: {
        items,
        back_urls: {
          success: process.env.MP_BACK_URL_SUCCESS || "https://tu-dominio.com/success",
          failure: process.env.MP_BACK_URL_FAILURE || "https://tu-dominio.com/failure",
          pending: process.env.MP_BACK_URL_PENDING || "https://tu-dominio.com/pending",
        },
        auto_return: "approved"
      }
    });
    
    // En las versiones actuales del SDK, el objeto 'response' retorna directamente las propiedades
    res.status(200).json({
      message: "Preferencia de pago creada exitosamente",
      init_point: response.init_point,
      preference_id: response.id,
    });
  } catch (error: any) {
    console.error("Error al crear la preferencia de pago:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Endpoint para recibir notificaciones (webhooks) de Mercado Pago.
 */
export const mpWebhook = (req: any, res: any) => {
  console.log("Notificación de Mercado Pago:", req.body);
  res.status(200).json({ message: "Notificación recibida" });
};

/**
 * Maneja la redirección luego de un pago exitoso.
 */
export const paymentSuccess = (req: any, res: any) => {
  const { payment_id, status, merchant_order_id } = req.query;
  res.status(200).json({
    message: "Pago aprobado",
    payment_id,
    status,
    merchant_order_id,
  });
};

/**
 * Maneja la redirección en caso de fallo en el pago.
 */
export const paymentFailure = (req: any, res: any) => {
  res.status(200).json({ message: "El pago ha fallado" });
};

/**
 * Maneja la redirección en caso de pago pendiente.
 */
export const paymentPending = (req: any, res: any) => {
  res.status(200).json({ message: "El pago está pendiente" });
};
