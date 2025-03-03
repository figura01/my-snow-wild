import { gql } from "@apollo/client";

export const LOGIN = gql`
    query Login($infos: InputLogin!) {
        login(infos: $infos) {
            id
            email
            role
        }
    }
`;