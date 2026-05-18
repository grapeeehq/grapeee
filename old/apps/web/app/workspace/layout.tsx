import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/session";

import { WorkspaceShell } from "./workspace-shell";

export const metadata = {
  title: "Workspace · Grapeee",
};

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) redirect("/sign-in");

  const user = {
    id: session.user.id,
    name: session.user.name ?? session.user.email ?? "you",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };

  return <WorkspaceShell user={user}>{children}</WorkspaceShell>;
}
