import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, plan, pack } = body;
    const params = new URLSearchParams();
    if (mode) params.set("mode", mode);
    if (plan) params.set("plan", plan);
    if (pack != null) params.set("pack", String(pack));

    return NextResponse.json({ url: `/checkout?${params.toString()}` });
  } catch (err) {
    return NextResponse.json({ url: "/checkout" });
  }
}
