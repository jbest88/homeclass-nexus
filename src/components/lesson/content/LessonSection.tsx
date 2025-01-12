import React from "react";
import ReactMarkdown from "react-markdown";

interface LessonSectionProps {
  content: string;
}

export const LessonSection = ({ content }: LessonSectionProps) => {
  return (
    <div className="prose dark:prose-invert max-w-none prose-headings:mb-6 prose-p:mb-4">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};