import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler, type Router } from "express";
import { GraphQLError } from "graphql";
import { AUTH_COOKIE, verifyToken } from "./auth/token";
import { env } from "./config/env";
import { UserRole } from "./entities/User";
import { addMaterialImage, IMAGE_TYPES, imageUrl, MAX_IMAGE_BYTES } from "./services/images";

/**
 * Photos des matériels :
 * - GET  /uploads/<fichier>                   : fichiers envoyés, servis tels quels (cache long, noms uniques) ;
 * - POST /api/materials/:id/images?alt=…      : envoi d'une photo (ADMIN), le corps est l'image brute.
 * Le reste de la gestion (ordre, texte alternatif, suppression) passe par GraphQL.
 */
export function uploadsRouter(): Router {
  const router = express.Router();

  router.use(
    "/uploads",
    express.static(env.uploadDir, {
      index: false,
      dotfiles: "deny",
      maxAge: "30d",
      immutable: true,
      setHeaders: (res) => {
        // Le navigateur ne doit jamais interpréter un fichier envoyé comme autre chose qu'une image.
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox");
      },
    }),
  );

  router.post(
    "/api/materials/:id/images",
    cookieParser(),
    (req, res, next) => {
      // Protection CSRF : la requête doit venir du site lui-même.
      const origin = req.header("origin");
      if (origin && origin !== new URL(env.frontendUrl).origin) {
        res.status(403).json({ error: "Origine refusée." });
        return;
      }
      const user = verifyToken(req.cookies?.[AUTH_COOKIE]);
      if (!user) {
        res.status(401).json({ error: "Connexion requise." });
        return;
      }
      if (user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Réservé aux administrateurs." });
        return;
      }
      next();
    },
    express.raw({ type: IMAGE_TYPES, limit: MAX_IMAGE_BYTES }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body)) {
        res.status(415).json({ error: "Format non pris en charge : JPEG, PNG ou WebP uniquement." });
        return;
      }
      try {
        const alt = typeof req.query.alt === "string" ? req.query.alt : "";
        const image = await addMaterialImage(String(req.params.id), req.body, alt);
        res.status(201).json({ id: image.id, url: imageUrl(image), alt: image.alt, position: image.position });
      } catch (error) {
        if (error instanceof GraphQLError) {
          res.status(error.extensions.code === "NOT_FOUND" ? 404 : 400).json({ error: error.message });
          return;
        }
        throw error;
      }
    },
  );

  const onError: ErrorRequestHandler = (error, _req, res, _next) => {
    if ((error as { type?: string }).type === "entity.too.large") {
      res.status(413).json({ error: "Photo trop lourde (5 Mo au maximum)." });
      return;
    }
    console.error("[uploads]", error);
    res.status(500).json({ error: "Envoi impossible." });
  };
  router.use(onError);

  return router;
}
