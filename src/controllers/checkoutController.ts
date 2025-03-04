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
          success: process.env.MP_BACK_URL_SUCCESS || "https://frontend-re-wear.vercel.app/paymentsuccess",
          failure: process.env.MP_BACK_URL_FAILURE || "https://frontend-re-wear.vercel.app/paymenterror",
          pending: process.env.MP_BACK_URL_PENDING || "https://frontend-re-wear.vercel.app/paymentpending",
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
 * Maneja la redirección luego de un pago exitoso y guarda la transacción en la base de datos.
 * Se espera recibir en req.query:
 * - payment_id
 * - status
 * - merchant_order_id
 * - product_id: ID del producto comprado
 * - buyer_id: ID del comprador
 * - total_amount: Monto total de la transacción
 * - payment_method: Método de pago utilizado
 */
export const paymentSuccess = (req: any, res: any) => {
  const { payment_id, status, merchant_order_id, product_id, buyer_id, total_amount, payment_method } = req.query;

  if (!payment_id || !status || !merchant_order_id || !product_id || !buyer_id || !total_amount || !payment_method) {
    return res.status(400).json({ error: "Faltan parámetros necesarios para guardar la transacción" });
  }
  
  const transactionDate = new Date();
  const transactionStatus = "completed"; // Se asume que el pago aprobado es completado

  const insertQuery = `
    INSERT INTO transaction (product_id, buyer_id, transaction_date, payment_method, total_amount, transaction_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Actualizar el estado del producto a out_of_stock
  const updateQuery = `
    UPDATE product
    SET publication_status = 'out_of_stock'
    WHERE product_id = ?
  `;

  // Eliminar items del carrito para ese producto y usuario
  const deleteQuery = `
    DELETE FROM cart
    WHERE product_id = ? AND user_id = ?
  `;
  // Primero, inserta la transacción
  executeQuery(insertQuery, [product_id, buyer_id, transactionDate, payment_method, total_amount, transactionStatus], (err: any, results: any) => {
    if (err) {
      console.error("Error al guardar la transacción:", err);
      return res.status(500).json({ error: "Error al guardar la transacción" });
    }
    
    // Actualiza el estado del producto
    executeQuery(updateQuery, [product_id], (updateErr: any, updateResults: any) => {
      if (updateErr) {
        console.error("Error al actualizar el producto:", updateErr);
        return res.status(500).json({ error: "Error al actualizar el producto" });
      }
      
      // Finalmente, elimina el item del carrito del usuario
      executeQuery(deleteQuery, [product_id, buyer_id], (deleteErr: any, deleteResults: any) => {
        if (deleteErr) {
          console.error("Error al eliminar el carrito:", deleteErr);
          return res.status(500).json({ error: "Error al eliminar el carrito" });
        }
        
        res.status(200).json({
          message: "Pago aprobado, transacción guardada, producto actualizado a out_of_stock y carrito eliminado",
          payment_id,
          status,
          merchant_order_id,
        });
      });
    });
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

/**
 * Endpoint para obtener el historial de compras (transacciones) de un usuario.
 * Se espera recibir en req.query:
 * - buyer_id: ID del comprador para filtrar sus transacciones
 */
export const getPurchaseHistory = (req: any, res: any) => {
    const buyer_id = req.user.id; // Obtenemos el id del usuario autenticado
  
    if (!buyer_id) {
      return res.status(400).json({ error: "El id del comprador es obligatorio para obtener el historial de compras" });
    }
    
    const selectQuery = `
      SELECT * FROM transaction
      WHERE buyer_id = ?
      ORDER BY transaction_date DESC
    `;
    
    executeQuery(selectQuery, [buyer_id], (err: any, results: any) => {
      if (err) {
        console.error("Error al obtener el historial de transacciones:", err);
        return res.status(500).json({ error: "Error al obtener el historial de transacciones" });
      }
      
      res.status(200).json({
        message: "Historial de transacciones obtenido correctamente",
        transactions: results
      });
    });
  };