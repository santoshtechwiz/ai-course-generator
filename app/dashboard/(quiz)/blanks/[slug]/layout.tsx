import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fill in the Blanks Quiz | CourseAI",
  description: "Test your programming knowledge with fill-in-the-blank questions",
};

export default function BlanksQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-5xl mx-auto py-6 px-4">
      {children}
    </div>
  );
}
