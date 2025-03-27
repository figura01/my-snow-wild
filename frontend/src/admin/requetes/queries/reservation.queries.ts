import { gql } from "@apollo/client";

export const GET_RESERVATIONS = gql`
  query AdminGetReservations {
    adminGetReservations {
      end_date
      id
      start_date
      status
      reservationMaterials {
        id
        material {
          id
          name
          price
        }
      }
      user {
        firstName
        id
        lastName
      }
    }
  }
`;