import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routes } from "@/lib/routes";

export interface Payload {
  email: string;
  role: string;
  userId: string;
}

const NEXT_PUBLIC_JWT_SECRET_KEY = process.env.NEXT_PUBLIC_JWT_SECRET_KEY || "";
console.log(NEXT_PUBLIC_JWT_SECRET_KEY)
 
// export function middleware(request) {
//     console.log('hello !!!!!!!!');
// }


export default async function middleware(request: NextRequest) {
  console.log('enter in middleware !!!')
  const { cookies } = request;
  const token = cookies.get("token");
  console.log('request.nextUrl.pathname: ----->', request.nextUrl.pathname)
  if(token) {

    console.log("token email in middleware: ", token)
  }
  return await checkToken(token?.value, request);
}

export async function verify(token: string): Promise<Payload> {
  const { payload } = await jwtVerify<Payload>(
    token,
    new TextEncoder().encode(NEXT_PUBLIC_JWT_SECRET_KEY)
  );

  return payload;
}

async function checkToken(token: string | undefined, request: NextRequest) {
  console.log('enter in meddlexare: request.nextUrl: ', request.nextUrl)
  const prevLocation = request.nextUrl.pathname;
  const currentRoute = findRouteByPathname(prevLocation);

  let response = NextResponse.next();

  if(!token) {
      console.log("No TOken")

      if (currentRoute && currentRoute.protected !== "PUBLIC") {
        response = NextResponse.redirect(
          new URL(
            `/auth/login?requestedURL=${request.nextUrl.pathname}`,
            request.url
          )
        );
      }
  } else {
    try {
      const { email, role, userId } = await verify(token);
      console.log('email: ', email)
      console.log('role: ', role)
      if (email && role && userId) {
        // On vérifie que le role de l'utilisateur est "ADMIN" pour les routes "ADMIN"
        if (currentRoute?.protected === "ADMIN" && role !== "ADMIN") {
          response = NextResponse.redirect(
            new URL("/errors/unauthorized", request.url)
          ); // Créer une page "Access denied"
        }
        //On ajoute des cookie avec les infos du user
        response.cookies.set("email", email);
        response.cookies.set("role", role);
        response.cookies.set("id", userId);
  
        return response;
      }

      return NextResponse.redirect(
        new URL(
          `/auth/login?requestedURL=${request.nextUrl.pathname}`,
          request.url
        )
      );
        
    } catch (error: unknown) {
        console.error("error: ", error)
        response = NextResponse.redirect(
          new URL(
            `/auth/login?requestedURL=${request.nextUrl.pathname}`,
            request.url
          )
        );
        //On delete les cookies existants
        response.cookies.delete("token");
        response.cookies.delete("email");
        response.cookies.delete("role");
        response.cookies.delete("userId");
    }
    
    return response
  }
}

function findRouteByPathname(url: string) {
  if (url === "/") {
    return routes.home;
  }
  const routeKeys = Object.keys(routes).filter((e) => e !== "home");

  for (const key of routeKeys) {
    if (url.includes(routes[key].pathname)) {
      return routes[key];
    }
  }
  return null;
}