import { workflow } from "@/lib/clients";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  console.log("cancel workflow with run ID: ", id);

  await workflow.cancel({
    ids: id,
  });

  return new Response("canceled workflow run!");
}
