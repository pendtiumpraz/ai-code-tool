import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { TRIAL_CONFIG, getPlanById } from '@/config/pricing';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      planId?: string;
      subscriptionStatus?: string;
      googleAccessToken?: string;
    };
  }
  
  interface User {
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
    planId?: string;
    subscriptionStatus?: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: number;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  
  providers: [
    // Google OAuth with Drive scope (only if credentials are set)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: [
              'openid',
              'email',
              'profile',
              'https://www.googleapis.com/auth/drive.file',
              'https://www.googleapis.com/auth/drive.appdata',
            ].join(' '),
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      }),
    ] : []),
    
    // Email/Password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: { include: { plan: true } } },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth sign-ins, check/create user and set up trial
      if (account?.provider === 'google') {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { subscription: true },
          });
          
          // New user - set up trial
          if (!dbUser) {
            // Get or create free plan first
            let freePlan = await prisma.plan.findUnique({
              where: { name: 'free' },
            });
            
            if (!freePlan) {
              // Create default plans if they don't exist
              await seedDefaultPlans();
              freePlan = await prisma.plan.findUnique({
                where: { name: 'free' },
              });
            }
            
            // Get trial plan
            const trialPlan = await prisma.plan.findUnique({
              where: { name: TRIAL_CONFIG.defaultTrialPlan },
            });
            
            // User will be created by adapter, we'll update subscription after
          } else if (!dbUser.subscription) {
            // Existing user without subscription - give them trial
            const trialPlan = await prisma.plan.findUnique({
              where: { name: TRIAL_CONFIG.defaultTrialPlan },
            });
            
            if (trialPlan) {
              await prisma.subscription.create({
                data: {
                  userId: dbUser.id,
                  planId: trialPlan.id,
                  status: 'TRIAL',
                  trialEndsAt: new Date(Date.now() + TRIAL_CONFIG.trialDays * 24 * 60 * 60 * 1000),
                },
              });
            }
          }
          
          // Store Google tokens
          if (account.access_token) {
            await prisma.user.update({
              where: { email: user.email! },
              data: {
                googleAccessToken: account.access_token,
                googleRefreshToken: account.refresh_token || undefined,
                googleTokenExpiry: account.expires_at 
                  ? new Date(account.expires_at * 1000) 
                  : undefined,
              },
            }).catch(() => {
              // User might not exist yet (first sign in), will be handled by adapter
            });
          }
          
        } catch (error) {
          console.error('Error in signIn callback:', error);
        }
      }
      
      return true;
    },
    
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role || 'USER';
      }
      
      // Store Google tokens in JWT
      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token;
        token.googleTokenExpiry = account.expires_at;
      }
      
      // Refresh user data periodically or on update
      if (trigger === 'update' || !token.planId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { 
            subscription: { 
              include: { plan: true } 
            } 
          },
        });
        
        if (dbUser) {
          token.role = dbUser.role;
          token.planId = dbUser.subscription?.plan.name;
          token.subscriptionStatus = dbUser.subscription?.status;
          
          // Update tokens if stored in DB
          if (dbUser.googleAccessToken) {
            token.googleAccessToken = dbUser.googleAccessToken;
          }
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.planId = token.planId;
        session.user.subscriptionStatus = token.subscriptionStatus;
        session.user.googleAccessToken = token.googleAccessToken;
      }
      return session;
    },
  },
  
  events: {
    async createUser({ user }) {
      // New user created - set up trial subscription
      try {
        let trialPlan = await prisma.plan.findUnique({
          where: { name: TRIAL_CONFIG.defaultTrialPlan },
        });
        
        if (!trialPlan) {
          await seedDefaultPlans();
          trialPlan = await prisma.plan.findUnique({
            where: { name: TRIAL_CONFIG.defaultTrialPlan },
          });
        }
        
        if (trialPlan) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              planId: trialPlan.id,
              status: 'TRIAL',
              trialEndsAt: new Date(Date.now() + TRIAL_CONFIG.trialDays * 24 * 60 * 60 * 1000),
            },
          });
        }
        
        // Log audit
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_created',
            resource: 'user',
            resourceId: user.id,
            details: { email: user.email },
          },
        });
        
      } catch (error) {
        console.error('Error setting up new user:', error);
      }
    },
  },
};

// Seed default plans
async function seedDefaultPlans() {
  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      type: 'FREE' as const,
      priceMonthly: 0,
      priceYearly: 0,
      tokensPerDay: 5000,
      tokensPerMonth: 100000,
      toolCallsPerDay: 20,
      requestsPerDay: 50,
      requestsPerMinute: 5,
      storageMB: 100,
      projectsLimit: 2,
      teamMembers: 1,
      features: ['ai_chat', 'workspaces', 'code_editor', 'google_drive'],
      sortOrder: 0,
    },
    {
      name: 'starter',
      displayName: 'Starter',
      type: 'STARTER' as const,
      priceMonthly: 9,
      priceYearly: 90,
      tokensPerDay: 25000,
      tokensPerMonth: 500000,
      toolCallsPerDay: 100,
      requestsPerDay: 200,
      requestsPerMinute: 15,
      storageMB: 1024,
      projectsLimit: 10,
      teamMembers: 1,
      features: ['ai_chat', 'workspaces', 'code_editor', 'google_drive', 'security_basic', 'email_support'],
      sortOrder: 1,
    },
    {
      name: 'pro',
      displayName: 'Pro',
      type: 'PRO' as const,
      priceMonthly: 29,
      priceYearly: 290,
      tokensPerDay: 100000,
      tokensPerMonth: 2000000,
      toolCallsPerDay: 500,
      requestsPerDay: 1000,
      requestsPerMinute: 30,
      storageMB: 10240,
      projectsLimit: 50,
      teamMembers: 1,
      features: ['ai_chat', 'workspaces', 'code_editor', 'google_drive', 'security_full', 'priority_support', 'api_access', 'custom_agents'],
      highlighted: true,
      sortOrder: 2,
    },
    {
      name: 'business',
      displayName: 'Business',
      type: 'BUSINESS' as const,
      priceMonthly: 79,
      priceYearly: 790,
      tokensPerDay: 500000,
      tokensPerMonth: 10000000,
      toolCallsPerDay: 2000,
      requestsPerDay: 5000,
      requestsPerMinute: 60,
      storageMB: 102400,
      projectsLimit: -1,
      teamMembers: 10,
      features: ['ai_chat', 'workspaces', 'code_editor', 'google_drive', 'security_enterprise', 'support_24_7', 'api_access', 'custom_agents', 'team', 'sso'],
      sortOrder: 3,
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      type: 'ENTERPRISE' as const,
      priceMonthly: -1,
      priceYearly: -1,
      tokensPerDay: -1,
      tokensPerMonth: -1,
      toolCallsPerDay: -1,
      requestsPerDay: -1,
      requestsPerMinute: 120,
      storageMB: -1,
      projectsLimit: -1,
      teamMembers: -1,
      features: ['all'],
      sortOrder: 4,
    },
  ];
  
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }
}

export default authOptions;
