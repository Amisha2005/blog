import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import GithubProvider from "next-auth/providers/github"

const handler= NextAuth({
  providers: [
    // OAuth authentication providers...
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
     GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET
    }),
  ],
 callbacks: {
  async signIn({ user, account }) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/oauth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            username: user.name,
            provider: account.provider,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        user.backendToken = data.token; // 👈 attach token
        return true;
      }

      return false;
    } catch (err) {
      console.error("OAuth backend error", err);
      return false;
    }
  },

  async jwt({ token, user }) {
    if (user?.backendToken) {
      token.backendToken = user.backendToken;
    }
    return token;
  },

  async session({ session, token }) {
    session.backendToken = token.backendToken;
    return session;
  },
}
})
export { handler as GET, handler as POST }