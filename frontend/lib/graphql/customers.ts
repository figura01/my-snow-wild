import { gql } from "@apollo/client";

export const PREVIEW_CUSTOMER_IMPORT = gql`
  mutation PreviewCustomerImport($csv: String!) {
    previewCustomerImport(csv: $csv) {
      rows
      valid
      customers { line email firstName lastName city action }
      errors { line message }
      warnings { line message }
    }
  }
`;

export const IMPORT_CUSTOMERS = gql`
  mutation ImportCustomers($csv: String!) {
    importCustomers(csv: $csv) { created updated skipped }
  }
`;

export const EXPORT_CUSTOMERS = gql`
  query ExportCustomers { exportCustomersCsv }
`;

export const CUSTOMER_TEMPLATE = gql`
  query CustomerTemplate { customerImportTemplate }
`;

export const EXPORT_RESERVATIONS = gql`
  query ExportReservations($statuses: [ReservationStatus!]) { exportReservationsCsv(statuses: $statuses) }
`;
