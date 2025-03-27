import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query Users {
    users {
      email
      id
      role
      firstName
      lastName
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($getUserByIdId: String!) {
  getUserById(id: $getUserByIdId) {
    id
    firstName
    email
    lastName
    phone
    role
    reservations {
      id
      start_date
      status
      end_date
      createdAt
    }
  }
}
`;
