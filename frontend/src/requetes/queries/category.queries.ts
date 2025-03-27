import { gql } from "@apollo/client";

export const ADMIN_GET_CATEGORIES = gql`
  query Categories {
    categories {
      id
      name
    }
  }
`;

export const ADMIN_GET_CATEGORY_BY_ID = gql`
  query FindCategory($findCategoryId: String!) {
  findCategory(id: $findCategoryId) {
    id
    name
  }
}
`;