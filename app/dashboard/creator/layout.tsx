import CreatorNav from "@/components/CreatorNav";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <CreatorNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
