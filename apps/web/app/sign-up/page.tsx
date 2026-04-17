import { redirect } from "next/navigation";

import { AuthForm } from "@/app/_components/auth-form";
import { isGoogleConfigured } from "@/lib/auth";
import { getServerSession } from "@/lib/session";

export const metadata = {
  title: "Create account · Grapeee",
};

export default async function SignUpPage() {
  const session = await getServerSession();
  if (session?.user) redirect("/workspace");

  return <AuthForm mode="sign-up" googleEnabled={isGoogleConfigured} />;
}
