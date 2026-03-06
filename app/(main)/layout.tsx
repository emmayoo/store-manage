import { AppBottomNav } from "@/components/app-bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-14">
      <main className="mx-auto max-w-lg">{children}</main>
      <AppBottomNav />
    </div>
  );
}
