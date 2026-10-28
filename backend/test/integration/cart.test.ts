import { AppDataSource } from "../../src/data-source";
import { Reservation } from "../../src/entities/Reservation";
import { reservedQuantities } from "../../src/services/availability";
import { findDraft, saveDraft } from "../../src/services/cart";
import { createPendingReservation, expireStaleReservations, userReservations } from "../../src/services/reservations";
import { billing, closeDb, createMaterial, createUser, gql, inDays, openDb, resetDb, ReservationStatus, UserRole } from "./helpers";

beforeAll(openDb);
afterAll(closeDb);
beforeEach(resetDb);

const period = { startDate: inDays(10), endDate: inDays(12) };

describe("panier enregistré (réservation DRAFT)", () => {
  it("enregistre, remplace puis supprime le panier du client", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ "160 cm": 3, "170 cm": 2 });

    const first = await saveDraft(user.id, { ...period, items: [{ variantId: variants[0].id, quantity: 1 }] });
    expect(first?.status).toBe(ReservationStatus.DRAFT);

    const second = await saveDraft(user.id, {
      ...period,
      items: [
        { variantId: variants[1].id, quantity: 2 },
        { variantId: variants[1].id, quantity: 1 }, // même taille : regroupée
      ],
    });
    expect(second?.id).toBe(first?.id); // un seul panier par client
    expect(second?.items.map((i) => [i.variant.id, i.quantity])).toEqual([[variants[1].id, 3]]);

    expect(await saveDraft(user.id, { ...period, items: [] })).toBeNull();
    expect(await findDraft(user.id)).toBeNull();
  });

  it("ne bloque aucun matériel et n'apparaît pas dans les réservations du client", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ M: 1 });
    await saveDraft(user.id, { ...period, items: [{ variantId: variants[0].id, quantity: 1 }] });

    expect((await reservedQuantities([variants[0].id], period.startDate, period.endDate)).get(variants[0].id)).toBeUndefined();
    expect(await userReservations(user.id)).toEqual([]);
  });

  it("devient la commande : le panier est supprimé quand la réservation est créée", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ M: 2 });
    const items = [{ variantId: variants[0].id, quantity: 1 }];
    await saveDraft(user.id, { ...period, items });

    await createPendingReservation(user.id, period.startDate, period.endDate, items, billing);
    expect(await findDraft(user.id)).toBeNull();
    expect((await userReservations(user.id)).map((r) => r.status)).toEqual([ReservationStatus.PENDING]);
  });

  it("passe en EXPIRED les réservations non payées dans le délai", async () => {
    const user = await createUser();
    const { variants } = await createMaterial({ M: 2 });
    const reservation = await createPendingReservation(user.id, period.startDate, period.endDate, [{ variantId: variants[0].id, quantity: 1 }], billing);
    await AppDataSource.getRepository(Reservation).update(reservation.id, { expiresAt: new Date(Date.now() - 1000) });

    expect(await expireStaleReservations()).toBe(1);
    expect((await AppDataSource.getRepository(Reservation).findOneByOrFail({ id: reservation.id })).status).toBe(ReservationStatus.EXPIRED);
  });

  it("expose le panier au client connecté seulement, et les paniers aux admins sur demande", async () => {
    const [client, admin] = [await createUser(), await createUser(UserRole.ADMIN)];
    const { variants } = await createMaterial({ M: 2 });
    const SAVE = `mutation ($cart: CartInput!) { saveCart(cart: $cart) { status items { quantity } } }`;
    const cart = { ...period, items: [{ variantId: variants[0].id, quantity: 2 }] };

    expect((await gql(SAVE, { cart })).errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
    expect((await gql(SAVE, { cart }, client)).data?.saveCart).toEqual({ status: "DRAFT", items: [{ quantity: 2 }] });
    expect((await gql("{ myCart { status } }", {}, client)).data?.myCart).toEqual({ status: "DRAFT" });

    const all = await gql("{ adminReservations { id } }", {}, admin);
    expect(all.data?.adminReservations).toEqual([]); // paniers exclus par défaut
    const drafts = await gql("{ adminReservations(statuses: [DRAFT]) { status user { email } } }", {}, admin);
    expect(drafts.data?.adminReservations).toEqual([{ status: "DRAFT", user: { email: client.email } }]);
  });
});
