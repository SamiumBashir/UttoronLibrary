import { NextResponse } from "next/server";
import { addNewsletterSubscriber } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  const { alreadySubscribed } = addNewsletterSubscriber(email);
  return NextResponse.json({
    subscribed: true,
    alreadySubscribed,
    message: alreadySubscribed
      ? "You are already subscribed to Uttoron Prokasoni dispatches."
      : "Welcome to Uttoron Prokasoni. Expect our seasonal reading letter soon.",
  });
}

