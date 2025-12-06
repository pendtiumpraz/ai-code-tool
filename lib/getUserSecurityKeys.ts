import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';

export interface UserSecurityKeys {
  shodanKey: string | null;
  virusTotalKey: string | null;
}

export async function getUserSecurityKeys(userEmail: string): Promise<UserSecurityKeys> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { securityKeys: true },
    });

    if (!user?.securityKeys) {
      return { shodanKey: null, virusTotalKey: null };
    }

    return {
      shodanKey: user.securityKeys.shodanKey ? decrypt(user.securityKeys.shodanKey) : null,
      virusTotalKey: user.securityKeys.virusTotalKey ? decrypt(user.securityKeys.virusTotalKey) : null,
    };
  } catch (error) {
    console.error('Error getting user security keys:', error);
    return { shodanKey: null, virusTotalKey: null };
  }
}
