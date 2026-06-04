import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    let dbUser = null;
    if (session?.user?.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, name: true, role: true },
      });
    }
    return NextResponse.json({
      session,
      dbUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
