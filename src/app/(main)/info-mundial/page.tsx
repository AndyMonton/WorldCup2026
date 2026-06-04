import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { InfoMundialView } from "@/components/info-mundial-view";

export default async function InfoMundialPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }

  return <InfoMundialView />;
}
