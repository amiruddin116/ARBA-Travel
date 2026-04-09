import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from '@/lib/db';
import crypto from 'crypto';

const credentialsSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // SHA-256 hash comparison — replace with bcrypt in production if needed
  const inputHash = crypto.createHash('sha256').update(password).digest('hex');
  return inputHash === hash;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const rows = await sql<{ id: string; email: string; name: string | null; password_hash: string; role: string }[]>`
          SELECT id, email, name, password_hash, role
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;

        const user = rows[0];
        if (!user) return null;

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name ?? undefined,
          role:  user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: unknown }).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
