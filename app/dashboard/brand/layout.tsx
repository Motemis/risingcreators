import BrandNav from "@/components/BrandNav";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <BrandNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}