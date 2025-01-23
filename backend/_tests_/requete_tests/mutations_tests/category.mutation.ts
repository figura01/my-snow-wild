export const CREATE_CATEGORY = `#graphql 
mutation CreateCategory($data: CreateCategoryInput!) {
  createCategory(data: $data) {
    id
    name
  }
}`;

export const DELETE_CATEGORY = `#graphql
  mutation DeleteCategory($deleteCategoryId: String!) {
    deleteCategory(id: $deleteCategoryId) {
      id
      name
    }
  }
`;
