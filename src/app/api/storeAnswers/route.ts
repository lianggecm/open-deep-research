import { NextResponse } from "next/server";
import { skipQuestions, storeAnswers } from "@/db/action"; // Import the functions

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, answers, togetherApiKey } = body;

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, message: "Invalid answers format." },
        { status: 400 }
      );
    }

    if (answers.length === 0) {
      // Logic for skipping questions
      console.log("Skipping questions for chatId:", chatId);
      await skipQuestions({ chatId, togetherApiKey }); // Use skipQuestions
      return NextResponse.json({
        success: true,
        message: "Questions skipped successfully",
      });
    } else {
      // Logic for storing answers
      console.log("Storing answers for chatId:", {
        chatId,
        answers,
        togetherApiKey,
      });
      await storeAnswers({ chatId, answers, togetherApiKey }); // Use storeAnswers
      return NextResponse.json({
        success: true,
        message: "Answers stored successfully",
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process request" },
      { status: 500 }
    );
  }
}
