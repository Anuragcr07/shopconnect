import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "SHOPKEEPER") {
    redirect("/shopkeeper/dashboard");
  } else {
    redirect("/customer/dashboard");
  }
}
