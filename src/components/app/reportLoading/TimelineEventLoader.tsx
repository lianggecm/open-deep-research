import React from "react";
import { motion } from "framer-motion";

export const TimelineEventLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex gap-3 pb-8"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full border-[0.7px] bg-[#F3F4F6] border-[#D1D5DC] flex items-center justify-center relative z-10">
        <img src="/timeline/loading.svg" className="size-[12px] animate-spin" />
      </div>
      <div className="flex-1 min-w-0 pl-1">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
      </div>
    </motion.div>
  );
};
