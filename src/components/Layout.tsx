import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Particles } from "./Particles";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Particles />
      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
