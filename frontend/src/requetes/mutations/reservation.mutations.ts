import { gql } from "@apollo/client";

export const DELETE_RESERVATION_BY_ADMIN = gql`
  mutation DeleteReservation($adminDeleteReservationId: String!) {
    adminDeleteReservation(id: $adminDeleteReservationId) {
      createdAt
      end_date
      start_date
      status
      user {
        id
        firstName
        lastName
      }
    }
  }
`;