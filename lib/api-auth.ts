import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(
  req: NextRequest,
  handler: (session: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return handler(session);
}

export async function requireResourceOwnership(
  req: NextRequest,
  resourceType: 'quiz' | 'course' | 'flashcard',
  resourceId: string,
  handler: (session: any, resource: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Find resource and check ownership
  let resource;
  
  switch (resourceType) {
    case 'quiz':
      resource = await prisma.userQuiz.findUnique({
        where: { id: Number(resourceId) || resourceId },
        select: { id: true, userId: true, isPublic: true }
      });
      break;
    // Add other resource types as needed
  }
  
  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }
  
  // Check if user owns the resource or if it's a public resource for read operations
  const isReadOperation = req.method === 'GET';
  const isPublic = resource.isPublic === true;
  
  if (resource.userId !== session.user.id && !(isReadOperation && isPublic)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return handler(session, resource);
}
