import "server-only";
import { RESERVATION_FIELDS, type Reservation } from "@/lib/reservations";
import { serverGraphql } from "./graphql";

export async function getReservation(id: string): Promise<Reservation | null> {
  try {
    const { reservation } = await serverGraphql<{ reservation: Reservation | null }>(
      `query($id: ID!) { reservation(id: $id) { ${RESERVATION_FIELDS} } }`,
      { id },
    );
    return reservation;
  } catch {
    return null;
  }
}
