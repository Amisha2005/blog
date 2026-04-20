import NextAuth from "next-auth";
declare module "next-auth" {
  interface Session {
    backendToken: string; // Add this line to include the backend token in the session
  }
  interface User {
    backendToken: string; // Add this line to include the backend token in the user object
  } 
}
declare module "next-auth/jwt" {
  interface JWT {
    backendToken: string; // Add this line to include the backend token in the JWT
  }
}