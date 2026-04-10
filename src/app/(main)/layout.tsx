import { AppTopBar } from "@/components/ui/app-top-bar";
import { MainShell } from "@/components/ui/main-shell";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppTopBar />
      <MainShell>{children}</MainShell>
    </>
  );
}
