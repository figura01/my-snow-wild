import type { Request, Response } from "express";
import { AUTH_COOKIE, verifyToken, type TokenPayload } from "./token";

// Contexte transmis à chaque resolver GraphQL.
export type Context = {
  req: Request;
  res: Response;
  user: TokenPayload | null;
};

export async function buildContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  return { req, res, user: verifyToken(token) };
}
