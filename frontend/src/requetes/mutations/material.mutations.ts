import { gql } from "@apollo/client";

export const CREATE_MATERIAL_ADMIN = gql`
  mutation CreateMaterial($data: CreateMaterialInput!) {
    createMaterial(data: $data) {
      category {
        name
        id
      }
      description
      id
      name
      picture
      price
      sizes {
        quantity
        size
      }
    }
  }
`;

export const DELETE_MATERIAL_BY_ADMIN = gql`
  mutation DeleteMaterial($deleteMaterialId: String!) {
    deleteMaterial(id: $deleteMaterialId) {
      id
    }
  }
`;

export const UPDATE_MATERIAL_ADMIN = gql`
  mutation UpdateMaterial($data: UpdateMaterialInput!) {
    updateMaterial(data: $data) {
      category {
        name
        id
      }
      description
      id
      name
      picture
      price
      sizes {
        size
        quantity
      }
    }
  }
`;