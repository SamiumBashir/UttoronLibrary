import { NextResponse } from "next/server";
import { addContactMessage } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  if (
    !body.name?.trim() ||
    !body.email?.trim() ||
    !body.message?.trim()
  ) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }

  const saved = addContactMessage({
    name: body.name.trim(),
    email: body.email.trim(),
    subject: body.subject?.trim() || "Editorial & Reader Inquiry",
    message: body.message.trim(),
  });

  return NextResponse.json({ submitted: true, id: saved.id }, { status: 201 });
}

