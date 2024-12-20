import React from "react";
import { CourseProgress } from "./CourseProgress";

function CourseListItem({ course, onSelect }) {
  return (
    <button
      className="w-full p-3 text-left rounded-lg hover:bg-accent mb-1 transition-colors"
      onClick={onSelect}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium truncate">{course.name}</div>
        <CourseProgress courseId={course.id} />
      </div>
    </button>
  );
}

export default CourseListItem;
