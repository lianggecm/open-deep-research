export const LandingCard = ({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) => {
  return (
    <div className="w-[226px] relative overflow-hidden rounded-xl bg-white p-[7px] flex flex-col gap-4">
      <img
        src={imageSrc}
        className="w-full h-full max-w-[212px] max-h-[92px]"
      />
      <div className="flex flex-col gap-2 px-2">
        <p className="text-base font-medium text-left text-black">{title}</p>
        <p className="text-xs text-left text-[#4a5565] mb-2">{description}</p>
      </div>
    </div>
  );
};
