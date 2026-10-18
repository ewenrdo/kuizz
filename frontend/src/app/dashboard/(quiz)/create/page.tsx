"use client";

import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import dynamic from "next/dynamic";

const CreatePage = dynamic(() => import("./PageClientCreate"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Quiz factory | Kuizz",
  description: "Create and manage your quizzes on Kuizz",
};

export default function Page() {
  return <CreatePage />;
}
