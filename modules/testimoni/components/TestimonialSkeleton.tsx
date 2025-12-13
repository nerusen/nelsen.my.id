"use client";

import { motion } from "framer-motion";

const TestimonialSkeleton = () => {
  return (
    <div className="w-full mb-4">
      <div className="flex gap-3">
        {/* Avatar Skeleton */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-neutral-300 dark:bg-neutral-700 rounded-full animate-pulse" />
        </div>

        {/* Bubble Skeleton */}
        <div className="flex-1">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-neutral-200 dark:border-neutral-700">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-20 h-4 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
                  ))}
                </div>
                <div className="w-16 h-3 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
              </div>
            </div>

            {/* Message Skeleton */}
            <div className="space-y-2 mb-3">
              <div className="w-full h-4 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
              <div className="w-3/4 h-4 bg-neutral-300 dark:bg-neutral-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialSkeleton;
