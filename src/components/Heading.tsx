export const Heading = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col gap-2 w-full pt-[60px]">
      <p className="w-full text-[32px] font-medium text-left text-[#101828]">
        {title}
      </p>
      <p className="w-full text-base font-light text-left text-[#6a7282]">
        {description}
      </p>
      <svg
        className="w-full pt-2 pb-6"
        width={"100%"}
        height={2}
        viewBox="0 0 350 2"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path d="M0 1L350 1.00003" stroke="#E5E7EB" />
      </svg>
    </div>
  );
};
