import { NextResponse } from "next/server";
import { checkCollegeDomain } from "@/lib/collegeCheck";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ approved: false, message: "Email is required." }, { status: 400 });
    }

    const result = await checkCollegeDomain(email);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ approved: false, message: "Invalid request." }, { status: 400 });
  }
}
