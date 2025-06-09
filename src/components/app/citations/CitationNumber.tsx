export const CitationNumber = ({ num }: { num: number }) => {
  return (
    <span className="mx-[1px] inline-block rounded bg-gray-200 px-1 align-text-bottom text-xs tabular-nums leading-normal dark:bg-slate-800 dark:text-slate-400 cursor-pointer">
      {num}
    </span>
  );
};
