import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dependency Analysis - GitHub Assistant",
  description: "Analyze dependencies between files across repositories",
};

export default function DependencyDiagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
