"use client";

import { useState } from "react";
import { Heading } from "../../Heading";
import { AnswerInput } from "./AnswerInput";

export const QuestionsPage = ({
  questions,
  onSkip,
  onGenerate,
}: {
  questions: string[];
  onSkip: () => void;
  onGenerate: (questions: string[]) => void;
}) => {
  const [answers, setAnswers] = useState<string[]>(
    Array(questions.length).fill("")
  );

  return (
    <div className="my-5 px-5 md:px-0 h-full flex flex-col flex-1 max-w-[671px] mx-auto">
      <Heading
        title="Answer some questions for a more accurate report"
        description="This is optional, you can skip this by clicking “Generate Report” or “Skip”."
      />
      <div className="flex flex-col gap-4">
        {questions?.map((question, index) => (
          <AnswerInput
            key={index}
            question={question}
            answer={answers[index]}
            setAnswer={(answer) => {
              setAnswers((prev) => {
                const newAnswers = [...prev];
                newAnswers[index] = answer;
                return newAnswers;
              });
            }}
            onEnter={() => {
              if (index === questions.length - 1) onGenerate(answers);
            }}
          />
        ))}
      </div>

      <div className="w-full items-center flex flex-col gap-3 self-end justify-end flex-1 md:flex-row-reverse pb-8">
        <button
          className="px-5 py-1.5 text-base font-medium !text-[#6a7282] cursor-pointer border border-[#6a7282]/50 rounded w-full md:w-[165px] items-center justify-center"
          onClick={() => {
            onSkip();
          }}
        >
          Skip
        </button>
        <button
          className="flex flex-col justify-between items-center w-full md:w-[165px] h-[38px] overflow-hidden px-5 py-1.5 rounded bg-[#072d77] border border-[#072d77] cursor-pointer"
          onClick={() => {
            onGenerate(answers);
          }}
        >
          <div className="flex justify-start items-center flex-grow-0 flex-shrink-0 relative gap-1.5">
            <p className="flex-grow-0 flex-shrink-0 text-base font-medium text-left text-white">
              Generate Report
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
