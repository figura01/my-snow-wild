import { gql } from "@apollo/client";

export const LIST_CATEGORIES= gql`
query Categories {
  categories {
    name
    id
  }
}
`;