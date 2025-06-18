export const Footer = () => {
  return (
    <div className="text-xs text-zinc-400 leading-5 mx-auto bottom-4 fixed">
      Powered By{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href="https://www.together.ai/models/deepseek-v3"
        className="font-semibold"
      >
        DeepSeek V3
      </a>{" "}
      on{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href="https://togetherai.link"
        className="font-semibold"
      >
        Together AI
      </a>
    </div>
  );
};
