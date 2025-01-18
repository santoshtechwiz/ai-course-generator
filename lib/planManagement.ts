import { User } from "@prisma/client";
import { prisma } from "./db";


export type PlanType = 'FREE' | 'BASIC' | 'PREMIUM';

interface PlanDetails {
  type: PlanType;
  credits: number;
  durationInDays: number;
}

export const planConfigurations: Record<PlanType, PlanDetails> = {
  FREE: { type: 'FREE', credits: 3, durationInDays: 0 },
  BASIC: { type: 'BASIC', credits: 50, durationInDays: 30 },
  PREMIUM: { type: 'PREMIUM', credits: 100, durationInDays: 30 },
};

export async function assignDefaultPlan(userId: string): Promise<User> {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      userType: 'FREE',
      credits: planConfigurations.FREE.credits,
    },
  });
}

export async function upgradePlan(userId: string, newPlanType: PlanType): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const currentPlan = planConfigurations[user.userType as PlanType] || planConfigurations.FREE;
  const newPlan = planConfigurations[newPlanType];

  if (!newPlan) throw new Error('Invalid plan type');
  if (currentPlan.type === newPlan.type) throw new Error('User is already on this plan');

  const now = new Date();
  const expirationDate = new Date(now.getTime() + newPlan.durationInDays * 24 * 60 * 60 * 1000);

  return await prisma.$transaction(async (prisma) => {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userType: newPlanType,
        credits: user.credits + newPlan.credits,
        subscriptions: {
          upsert: {
            create: {
              planId: newPlanType,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: expirationDate,
            },
            update: {
              planId: newPlanType,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: expirationDate,
            },
          },
        },
      },
      include: {
        subscriptions: true,
      },
    });

    await prisma.userBehavior.create({
      data: {
        userId: userId,
        action: 'PLAN_UPGRADE',
        entityType: 'subscription',
        entityId: updatedUser.subscriptions?.id || '',
        metadata: JSON.stringify({
          oldPlan: currentPlan.type,
          newPlan: newPlanType,
        }),
      },
    });

    return updatedUser;
  });
}

export async function handlePlanExpiration(userId: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscriptions: true },
  });
  if (!user) throw new Error('User not found');

  if (user.subscriptions && user.subscriptions.currentPeriodEnd <= new Date()) {
    return await prisma.$transaction(async (prisma) => {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          userType: 'FREE',
          credits: planConfigurations.FREE.credits,
          subscriptions: {
            update: {
              status: 'expired',
            },
          },
        },
        include: {
          subscriptions: true,
        },
      });

      await prisma.userBehavior.create({
        data: {
          userId: userId,
          action: 'PLAN_EXPIRED',
          entityType: 'subscription',
          entityId: updatedUser.subscriptions?.id || '',
          metadata: JSON.stringify({
            oldPlan: user.userType,
            newPlan: 'FREE',
          }),
        },
      });

      return updatedUser;
    });
  }

  return user;
}

export async function getPlanChangeHistory(userId: string) {
  return await prisma.userBehavior.findMany({
    where: {
      userId: userId,
      action: { in: ['PLAN_UPGRADE', 'PLAN_EXPIRED'] },
    },
    orderBy: { timestamp: 'desc' },
  });
}

