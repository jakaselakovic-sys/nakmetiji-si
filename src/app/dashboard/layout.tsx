import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nadzorna plošča — NaKmetiji",
  description: "Upravljajte svojo turistično kmetijo na platformi NaKmetiji.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
