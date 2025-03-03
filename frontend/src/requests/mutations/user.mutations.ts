import { gql } from "@apollo/client";

export const REGISTER_USER = gql`
    mutation Register($infos: InputRegister!) {
        register(infos: $infos) {
            id
            role
            email
        }
    }
`;


