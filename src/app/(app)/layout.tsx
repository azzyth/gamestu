import Nav from "@/components/Nav";
import PwaRegister from "@/components/PwaRegister";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      {children}
      <Nav />
      <PwaRegister />
    </div>
  );
}
