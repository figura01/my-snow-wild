import { gql } from "@apollo/client";

export const ADMIN_DELETE_CATEGORY = gql`
  mutation DeleteCategory($deleteCategoryId: String!) {
    deleteCategory(id: $deleteCategoryId) {
      id
      name
    }
  }
`;

export const ADMIN_CREATE_CATEGORY = gql`
  mutation CreateCategory($data: CreateCategoryInput!) {
    createCategory(data: $data) {
      id
      name
    }
  }
`;

export const ADMIN_UPDATE_CATEGORY = gql`
  mutation UpdateCategory($data: AdminUpdateCategoryInput!) {
    updateCategory(data: $data) {
      name
      id
    }
  }
`;