import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import { AUTH_COOKIE, signToken } from "../../src/auth/token";
import { AppDataSource } from "../../src/data-source";
import { Customer } from "../../src/entities/Customer";
import { Invoice } from "../../src/entities/Invoice";
import { Reservation } from "../../src/entities/Reservation";
import { User } from "../../src/entities/User";
import { invoicesRouter } from "../../src/invoices";
import { issueInvoice } from "../../src/services/invoices";
import { createPendingReservation, markPaid } from "../../src/services/reservations";
import { billing, closeDb, createMaterial, createUser, gql, inDays, openDb, resetDb, ReservationStatus, UserRole } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const invoices = () => AppDataSource.getRepository(Invoice);

/** Réservation de 3 jours : 2 × taille M à 15 € + 1 × taille L à 15 €. */
async function order(user?: User) {
  const owner = user ?? (await createUser());
  const { variants } = await createMaterial({ M: 3, L: 3 }, 1500);
  const reservation = await createPendingReservation(
    owner.id,
    inDays(10),
    inDays(12),
    [
      { variantId: variants[0].id, quantity: 2 },
      { variantId: variants[1].id, quantity: 1 },
    ],
    billing,
  );
  return { owner, reservation };
}

describe("émission des factures", () => {
  it("émet la facture au paiement, avec les montants HT / TVA / TTC", async () => {
    const { reservation } = await order();
    expect(await invoices().count()).toBe(0); // pas de facture tant que ce n'est pas payé

    await markPaid(reservation.id);
    const invoice = await invoices().findOneByOrFail({ reservationId: reservation.id });

    expect(invoice.number).toMatch(/^FA-\d{4}-0001$/);
    expect(invoice.totalTtcCents).toBe(13500); // 3 articles × 3 jours × 15 €
    expect(invoice.totalHtCents).toBe(11250);
    expect(invoice.vatCents).toBe(2250);
    expect(invoice.vatRateBps).toBe(2000);
    expect(invoice.lines).toHaveLength(2);
    expect(invoice.lines.map((l) => [l.size, l.quantity, l.days, l.totalCents])).toEqual([
      ["L", 1, 3, 4500],
      ["M", 2, 3, 9000],
    ]);
    expect(invoice.customerName).toBe("Camille Test");
  });

  it("numérote sans trou et ne crée jamais deux factures pour une réservation", async () => {
    const a = await order();
    const b = await order();
    await markPaid(a.reservation.id);
    await markPaid(b.reservation.id);
    // Webhook et retour du navigateur en même temps : une seule facture.
    const [x, y] = await Promise.all([issueInvoice(a.reservation.id), issueInvoice(a.reservation.id)]);
    expect(x.id).toBe(y.id);

    const numbers = (await invoices().find({ order: { sequence: "ASC" } })).map((i) => i.number.slice(-4));
    expect(numbers).toEqual(["0001", "0002"]);
  });

  it("repart à 0001 chaque année", async () => {
    const a = await order();
    const b = await order();
    await AppDataSource.getRepository(Reservation).update([a.reservation.id, b.reservation.id], { status: ReservationStatus.PAID });
    const first = await issueInvoice(a.reservation.id, new Date("2026-12-31T12:00:00Z"));
    const second = await issueInvoice(b.reservation.id, new Date("2027-01-02T12:00:00Z"));
    expect(first.number).toBe("FA-2026-0001");
    expect(second.number).toBe("FA-2027-0001");
  });

  it("refuse une réservation non payée", async () => {
    const { reservation } = await order();
    await expect(issueInvoice(reservation.id)).rejects.toThrow(/payée/);
  });

  it("reste figée si le profil ou le prix changent ensuite", async () => {
    const { owner, reservation } = await order();
    await markPaid(reservation.id);
    await AppDataSource.getRepository(Customer).update(owner.customer.id, { address: "99 avenue Nouvelle", city: "Lyon" });
    await AppDataSource.query(`UPDATE "material" SET "dailyPriceCents" = 9900`);

    const invoice = await issueInvoice(reservation.id);
    expect(invoice.customerAddress).toBe(billing.address);
    expect(invoice.customerCity).toBe(billing.city);
    expect(invoice.totalTtcCents).toBe(13500);
  });

  it("expose le numéro de facture sur la réservation", async () => {
    const { owner, reservation } = await order();
    await markPaid(reservation.id);
    const res = await gql(`{ myReservations { id invoice { number totalTtcCents } } }`, {}, owner);
    expect(res.errors).toBeUndefined();
    const [r] = (res.data as { myReservations: { invoice: { number: string; totalTtcCents: number } }[] }).myReservations;
    expect(r.invoice.number).toMatch(/^FA-/);
    expect(r.invoice.totalTtcCents).toBe(13500);
  });
});

describe("GET /api/reservations/:id/invoice", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express().use(invoicesRouter());
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise((resolve) => server.close(resolve)));

  const get = (id: string, user?: User) =>
    fetch(`${baseUrl}/api/reservations/${id}/invoice`, {
      headers: user ? { cookie: `${AUTH_COOKIE}=${signToken({ sub: user.id, role: user.role })}` } : {},
    });

  it("renvoie le PDF au client et à un admin", async () => {
    const { owner, reservation } = await order();
    await markPaid(reservation.id);

    const res = await get(reservation.id, owner);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toMatch(/filename="FA-\d{4}-0001\.pdf"/);
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.subarray(0, 5).toString()).toBe("%PDF-");

    expect((await get(reservation.id, await createUser(UserRole.ADMIN))).status).toBe(200);
  });

  it("refuse un visiteur, un autre client et une réservation non payée", async () => {
    const { owner, reservation } = await order();
    expect((await get(reservation.id)).status).toBe(401);
    expect((await get(reservation.id, owner)).status).toBe(409);
    await markPaid(reservation.id);
    expect((await get(reservation.id, await createUser())).status).toBe(404);
    expect((await get("pas-un-uuid", owner)).status).toBe(404);
  });

  it("émet à la demande la facture d'une réservation payée avant les factures", async () => {
    const { owner, reservation } = await order();
    await AppDataSource.getRepository(Reservation).update(reservation.id, { status: ReservationStatus.PAID, paidAt: new Date() });
    expect(await invoices().count()).toBe(0);
    expect((await get(reservation.id, owner)).status).toBe(200);
    expect(await invoices().count()).toBe(1);
  });
});
