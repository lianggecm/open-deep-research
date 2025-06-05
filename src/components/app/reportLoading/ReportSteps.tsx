type StepsType = {
  id: string;
  title: string;
  status: "pending" | "completed" | "loading";
};

export const ReportSteps = () => {
  const steps: StepsType[] = [
    {
      id: "1",
      title: "Initial Planning",
      status: "completed",
    },
    {
      id: "2",
      title: "Iteration #1",
      status: "pending",
    },
    {
      id: "3",
      title: "Iteration #2",
      status: "pending",
    },
    {
      id: "4",
      title: "Iteration #3",
      status: "pending",
    },
    {
      id: "5",
      title: "Writing Report",
      status: "pending",
    },
  ];
  return (
    <div className="flex flex-col relative overflow-hidden rounded-lg bg-white border-[0.7px] border-[#d1d5dc]">
      <div className="flex-shrink-0 h-[68px] p-4 flex flex-col justify-center border-b-[0.7px] border-[#d1d5dc]">
        <p className="text-base font-medium text-left text-[#101828]">
          Generating Report
        </p>
        <p className="text-xs text-left text-[#6a7282]">
          <span className="text-sm font-light text-left text-[#6a7282]">
            Time elapsed:
          </span>
          <span className="text-sm text-left text-[#6a7282] ml-1">14s</span>
        </p>
      </div>
      <div className="flex flex-col px-2 py-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-2 px-2 py-2.5 rounded"
          >
            <img
              src={
                step.status === "completed"
                  ? "/reportStep/completed.svg"
                  : step.status === "loading"
                  ? "/reportStep/loading.svg"
                  : "/reportStep/pending.svg"
              }
              className="size-3"
              alt={`${step.status} icon`}
            />
            <p
              className={`text-sm text-left ${
                step.status === "pending" ? "text-[#d1d5dc]" : ""
              }`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>

      <button className="px-4 py-3 text-sm font-light text-left text-[#826a6a] cursor-pointer">
        Cancel search
      </button>
    </div>
  );
};
