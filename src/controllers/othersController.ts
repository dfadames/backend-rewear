import db from "../db/dbConfig";
import { executeQuery } from "../db/models/queryModel";

// prueba de conexion con el servidor
export const ping = (req: any, res: any) => {
  console.log("someone just pinged here!!");
  res.send("pong");
};

// solicita la tabla usuarios de la base de datos
export const getUsuarios = (req: any, res: any) => {
  const query = "SELECT * FROM user";
  executeQuery(query, [], (error: Error, results: any) => {
    if (error) {
      res.status(500).send("Error interno del servidor");
    } else {
      res.json(results);
    }
  });
};


export const checkoutCart = (req: any, res: any) => {
  const { buyer_id, comment } = req.body;

  // Validación de parámetros
  if (!buyer_id || !comment) {
    return res.status(400).json({ error: "buyer_id y comment son obligatorios" });
  }
  if (comment !== "ok") {
    return res.status(400).json({ error: "El comentario debe ser 'ok'" });
  }

  // Consulta para obtener los items del carrito con el precio de cada producto
  const selectQuery = `
    SELECT c.product_id, c.user_id, c.quantity, p.price
    FROM cart c
    JOIN product p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  executeQuery(selectQuery, [buyer_id], (selectErr: any, cartItems: any) => {
    if (selectErr) {
      console.error("Error al consultar el carrito:", selectErr);
      return res.status(500).json({ error: "Error interno al consultar el carrito" });
    }
    if (!cartItems || cartItems.length === 0) {
      return res.status(404).json({ error: "El carrito está vacío" });
    }

    // Preparar los datos para insertar en la tabla transaction.
    // Según tu esquema, transaction tiene:
    //   product_id, buyer_id, transaction_date, payment_method, total_amount, transaction_status
    // Se asigna:
    //   payment_method: "cart"
    //   transaction_status: "completed"
    //   transaction_date: fecha actual (solo fecha en formato YYYY-MM-DD)
    const transactionDate = new Date().toISOString().slice(0, 10);
    const paymentMethod = "cart";
    const transactionStatus = "completed";

    // Se mapea cada item del carrito para calcular el total_amount y formar el arreglo para inserción masiva.
    const transactionData = cartItems.map((item: any) => {
      const totalAmount = item.price * item.quantity;
      return [
        item.product_id,
        buyer_id,
        transactionDate,
        paymentMethod,
        totalAmount,
        transactionStatus,
      ];
    });

    const insertQuery = `
      INSERT INTO transaction (product_id, buyer_id, transaction_date, payment_method, total_amount, transaction_status)
      VALUES ?
    `;
    executeQuery(insertQuery, [transactionData], (insertErr: any, insertResults: any) => {
      if (insertErr) {
        console.error("Error al insertar transacciones:", insertErr);
        return res.status(500).json({ error: "Error al guardar el historial de transacciones" });
      }

      // Una vez insertadas las transacciones, se elimina el carrito del buyer_id
      const deleteQuery = "DELETE FROM cart WHERE user_id = ?";
      executeQuery(deleteQuery, [buyer_id], (deleteErr: any, deleteResults: any) => {
        if (deleteErr) {
          console.error("Error al eliminar el carrito:", deleteErr);
          return res.status(500).json({ error: "Error al eliminar los items del carrito" });
        }

        res.status(200).json({
          message: "Historial de transacciones guardado y carrito eliminado exitosamente",
          transactionsInserted: insertResults.affectedRows,
          cartItemsDeleted: deleteResults.affectedRows,
        });
      });
    });
  });
};