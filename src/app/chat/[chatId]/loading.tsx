import React from "react";
import Image from "next/image"; // Import Image component for Next.js

const Loading = () => {
  return (
    <div className="fixed top-16 inset-x-0 bottom-0 flex items-center justify-center">
      <img
        src="/reportStep/loading.svg"
        alt="Loading Spinner"
        width={48}
        height={48}
        className="animate-spin"
      />
    </div>
  );
};

export default Loading;
