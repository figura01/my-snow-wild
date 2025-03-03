import { gql } from "@apollo/client";

export const LIST_MATERIAL= gql`
  query ListMaterials {
    listMaterials {
      category {
        id
        name
      }
      id
      name
      description
      picture
      price
      sizes {
        quantity
        size
      }
    }
  }`
;

export const GET_MATERIAL_BY_ID = gql`
  query FindMaterialById($findMaterialByIdId: String!) {
    findMaterialById(id: $findMaterialByIdId) {
      category {
        id
        name
      }
      id
      description
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

export const LIST_MATERIAL_BY_CATEGORY_ID = gql`
  query FindMaterialByCategories($findMaterialByCategoriesId: String!) {
    findMaterialByCategories(id: $findMaterialByCategoriesId) {
      picture
      name
      id
      description
    }
  }
`;

export const LIST_MATERIAL_BY_CATEGORY_NAME = gql`
  query FindMaterialByCategoriesName($name: String!) {
    findMaterialsByCategoryName(name: $name) {
      id
      name
      picture
      price
      description
      sizes {
        size
        quantity
      }
      category {
        id
        name
      }
    }
  }
`;