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

// --- Panier -----------------------------------------------------------------

export const QUOTE_CART = gql`
  query QuoteCart($cart: CartInput!) {
    quoteCart(cart: $cart) {
      startDate
      endDate
      days
      totalCents
      valid
      lines {
        variantId
        materialName
        size
        quantity
        available
        dailyPriceCents
        lineTotalCents
        ok
        message
      }
    }
  }
`;

// --- Commande ---------------------------------------------------------------

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($data: CheckoutInput!) {
    createReservation(data: $data) { reservationId paymentUrl }
  }
`;

export const CONFIRM_PAYMENT = gql`
  mutation ConfirmPayment($id: ID!, $sessionId: String) {
    confirmPayment(id: $id, sessionId: $sessionId) { id status isExpired totalCents }
  }
`;

// --- Utilisateurs (admin) -----------------------------------------------------

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($id: ID!, $role: UserRole!) {
    updateUserRole(id: $id, role: $role) { id role }
  }
`;
export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;
