export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-scroll flex h-full flex-col overflow-x-hidden overflow-y-auto bg-neutral-50">
      <header className="border-b border-neutral-200/80 bg-white px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
        <p className="text-lg font-semibold tracking-tight text-neutral-900">
          SideSpark
        </p>
        <p className="text-sm text-neutral-500">
          Buy, sell, and book with verified Butler students.
        </p>
      </header>
      <main className="flex-1 overflow-x-hidden px-4 py-5">{children}</main>
    </div>
  );
}
