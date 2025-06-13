import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

export const LandingHero = () => {
  const { isSignedIn, user, isLoaded } = useUser();

  const isAuthenticated = isSignedIn && !!user;

  return (
    <>
      {!isAuthenticated && (
        <a
          href="https://togetherai.link/"
          target="_blank"
          rel="noreferrer"
          className="w-[180px] relative items-center justify-center rounded bg-gray-50 border border-gray-200 flex flex-row gap-1 px-4 py-2"
        >
          <div className="text-xs text-[#6A7282] whitespace-nowrap">
            Powered by
          </div>
          <img
            src="/together.png"
            className="w-[77.3px] h-[12.94px] mt-0.5 object-fill"
            alt="Together.ai logo"
          />
        </a>
      )}

      <div
        className={cn(
          isAuthenticated ? "mb-8" : "mb-6",
          "flex flex-col gap-4 w-full"
        )}
      >
        <p className="text-[32px] md:text-[40px] font-medium text-center text-[#1e2939]">
          {!isAuthenticated ? (
            <>Reports with DeepSeek</>
          ) : (
            <>Welcome Back, {user.firstName || user.fullName || "Researcher"}</>
          )}
        </p>
        {!isAuthenticated && (
          <p className="mx-auto max-w-[364px] text-base text-center text-[#6a7282]">
            Have AI do research for you, refine your ideas, and turn every
            question into a meaningful report
          </p>
        )}
      </div>
    </>
  );
};
