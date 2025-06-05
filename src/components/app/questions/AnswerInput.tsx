export const AnswerInput = ({
  question,
  answer,
  setAnswer,
  onEnter,
}: {
  question: string;
  answer: string;
  setAnswer: (answer: string) => void;
  onEnter: () => void;
}) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="w-full text-base text-left text-[#101828]">{question}</p>
      <input
        className="w-full h-[38px] relative overflow-hidden rounded bg-white border-[0.7px] border-[#d1d5dc] text-base font-light text-left text-[#6a7282] px-3 py-2.5"
        type="text"
        placeholder="Answer here..."
        value={answer}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onEnter();
          }
        }}
        onChange={(e) => setAnswer(e.target.value)}
      ></input>
    </div>
  );
};
