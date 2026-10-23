import { GraphQLError } from "graphql";

export const notFound = (what: string) =>
  new GraphQLError(`${what} introuvable.`, { extensions: { code: "NOT_FOUND" } });

export const badInput = (message: string) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
