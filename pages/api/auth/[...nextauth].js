/**
 * NextAuth Configuration
 * 
 * Handles authentication for:
 * - Google OAuth (Gmail access)
 * - Microsoft OAuth (Outlook access)
 * 
 * Manages:
 * - User sessions
 * - OAuth tokens for email access
 * - Token refresh
 * - User tracking with Supabase
 */

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.modify',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: 'common',
      authorization: {
        params: {
          scope: 'openid email profile offline_access Mail.ReadWrite',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.provider = token.provider;
      
      // Use email as user ID (temporary solution)
      session.user.id = session.user.email;
      
      // Don't expose sensitive data to the client
      delete token.refreshToken;
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
