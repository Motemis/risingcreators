import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  const adminEmails = ["justin.motes@me.com", "motemis@gmail.com"];

  if (!user || !adminEmails.includes(user.emailAddresses[0]?.emailAddress || "")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AdminNav />
      {children}
    </div>
  );
}

