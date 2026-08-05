import { NextRequest, NextResponse } from "next/server";
import { run } from "@/agents/discovery-agent";

// Configure in vercel.json:
// { "crons": [{ "path": "/api/cron/discover", "schedule": "0 6 * * 1" }] }  // weekly, Monday 6am UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await run();
  return NextResponse.json({ ok: true, result });
}
