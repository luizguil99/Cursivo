import React from "react";
import { ProgressBar } from "./ProgressBar";

function CourseListItem({ course, onSelect }) {
  return (
    <button
      className="w-full p-3 text-left rounded-lg hover:bg-accent mb-1 transition-colors"
      onClick={onSelect}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium truncate">{course.name}</div>
        <ProgressBar progress={course.progress} />
      </div>
    </button>
  );
}

export default CourseListItem;
