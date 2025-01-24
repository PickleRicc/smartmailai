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
import { supabase } from '@/lib/supabase';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly"
        }
      }
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: "common",
      authorization: {
        params: {
          scope: "openid profile email offline_access https://graph.microsoft.com/mail.read"
        }
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) return false;

      try {
        // First, try to find existing user
        let { data: existingUser, error: findError } = await supabase
          .from('users')
          .select('id, email, provider')
          .eq('email', user.email)
          .single();

        if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found" error
          throw findError;
        }

        let userId;

        if (!existingUser) {
          // Create new user if doesn't exist
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email: user.email,
              provider: account.provider,
              provider_user_id: profile.sub || profile.oid
            })
            .select('id')
            .single();

          if (createError) throw createError;
          userId = newUser.id;
        } else {
          userId = existingUser.id;
          // Update existing user's provider info if needed
          if (existingUser.provider !== account.provider) {
            const { error: updateError } = await supabase
              .from('users')
              .update({
                provider: account.provider,
                provider_user_id: profile.sub || profile.oid
              })
              .eq('id', userId);

            if (updateError) throw updateError;
          }
        }
        
        // Store or update tokens
        if (account.access_token) {
          // First check if token exists
          const { data: existingToken } = await supabase
            .from('tokens')
            .select('id')
            .eq('user_id', userId)
            .eq('provider', account.provider)
            .single();

          if (existingToken) {
            // Update existing token
            const { error: tokenError } = await supabase
              .from('tokens')
              .update({
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                token_expires_at: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null
              })
              .eq('id', existingToken.id);

            if (tokenError) throw tokenError;
          } else {
            // Insert new token
            const { error: tokenError } = await supabase
              .from('tokens')
              .insert({
                user_id: userId,
                provider: account.provider,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                token_expires_at: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null
              });

            if (tokenError) throw tokenError;
          }
        }

        return true;
      } catch (error) {
        console.error('Error storing auth data:', error);
        return false;
      }
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
        token.access_token = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        const { data: user } = await supabase
          .from('users')
          .select('id, email, provider')
          .eq('email', session.user.email)
          .single();

        if (user) {
          session.user.id = user.id;
          session.user.provider = user.provider;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
};

export default NextAuth(authOptions);
