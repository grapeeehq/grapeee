import { redirect } from "next/navigation";

import { AuthForm } from "@/app/_components/auth-form";
import { isGoogleConfigured } from "@/lib/auth";
import { getServerSession } from "@/lib/session";

export const metadata = {
  title: "Log in · Grapeee",
};

export default async function SignInPage() {
  const session = await getServerSession();
  if (session?.user) redirect("/workspace");

  return <AuthForm mode="sign-in" googleEnabled={isGoogleConfigured} />;
}
