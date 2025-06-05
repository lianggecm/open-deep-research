import { workflow } from "@/lib/clients";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { chatId } = await request.json();
  console.log("cancel workflow with run ID: ", chatId);

  await workflow.cancel({
    ids: chatId,
  });

  return new Response("canceled workflow run!");
}
