import cookieParser from "cookie-parser";
import express, { type Router } from "express";
import { AUTH_COOKIE, verifyToken } from "./auth/token";
import { AppDataSource } from "./data-source";
import { Reservation, ReservationStatus } from "./entities/Reservation";
import { UserRole } from "./entities/User";
import { renderInvoicePdf } from "./services/invoice-pdf";
import { findInvoiceOf, issueInvoice } from "./services/invoices";

/**
 * GET /api/reservations/:id/invoice            : facture PDF affichée dans le navigateur ;
 * GET /api/reservations/:id/invoice?download=1 : même fichier, téléchargé.
 * Réservé au client de la réservation et aux administrateurs. Une réservation payée
 * avant la mise en place des factures reçoit la sienne au premier téléchargement.
 */
export function invoicesRouter(): Router {
  const router = express.Router();

  router.get("/api/reservations/:id/invoice", cookieParser(), async (req, res) => {
    const user = verifyToken(req.cookies?.[AUTH_COOKIE]);
    if (!user) {
      res.status(401).json({ error: "Connexion requise." });
      return;
    }

    const id = String(req.params.id);
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      res.status(404).json({ error: "Facture introuvable." });
      return;
    }
    const reservation = await AppDataSource.getRepository(Reservation).findOne({ where: { id }, relations: { user: true } });
    // Même réponse qu'une réservation inexistante : on ne révèle pas celles des autres.
    if (!reservation || (user.role !== UserRole.ADMIN && reservation.user?.id !== user.sub)) {
      res.status(404).json({ error: "Facture introuvable." });
      return;
    }
    if (reservation.status !== ReservationStatus.PAID) {
      res.status(409).json({ error: "La facture est disponible une fois la réservation payée." });
      return;
    }

    try {
      const invoice = (await findInvoiceOf(id)) ?? (await issueInvoice(id));
      const pdf = await renderInvoicePdf(invoice, { paidAt: reservation.paidAt, reservationId: id });
      const disposition = req.query.download ? "attachment" : "inline";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${invoice.number}.pdf"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(pdf);
    } catch (error) {
      console.error("[facture]", id, error);
      res.status(500).json({ error: "Facture indisponible pour le moment." });
    }
  });

  return router;
}
