import { Metadata } from "next";
import { useTranslations } from "next-intl";

import { getTranslations } from "next-intl/server";

import TestimonialsModule from "@/modules/testimoni";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("TestimoniPage");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function TestimoniPage() {
  return <TestimonialsModule />;
}
