export default function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-scroll flex h-full flex-col overflow-x-hidden overflow-y-auto bg-neutral-50">
      <main className="flex-1 overflow-x-hidden px-4 py-5">{children}</main>
    </div>
  );
}
