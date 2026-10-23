import { gql } from "@apollo/client";

// --- Champs partagés -------------------------------------------------------

export const CATEGORY_FIELDS = `id name slug description materialCount`;
export const MATERIAL_FIELDS = `id name slug description imageUrl dailyPriceCents totalStock isActive variants { id size stock } category { id name slug }`;

// --- Mutations (composants client) ----------------------------------------

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($data: CategoryInput!) {
    createCategory(data: $data) { id }
  }
`;
export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $data: CategoryInput!) {
    updateCategory(id: $id, data: $data) { id }
  }
`;
export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

export const CREATE_MATERIAL = gql`
  mutation CreateMaterial($data: MaterialInput!) {
    createMaterial(data: $data) { id }
  }
`;
export const UPDATE_MATERIAL = gql`
  mutation UpdateMaterial($id: ID!, $data: MaterialInput!) {
    updateMaterial(id: $id, data: $data) { id }
  }
`;
export const DELETE_MATERIAL = gql`
  mutation DeleteMaterial($id: ID!) {
    deleteMaterial(id: $id)
  }
`;
