import { NextResponse } from "next/server";
import { solveProblem } from "@/lib/solveService";
import type { SolveInput } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: SolveInput = await request.json();
    const result = solveProblem(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
