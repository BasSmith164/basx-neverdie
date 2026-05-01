import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold glow-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">ไม่พบหน้านี้</h2>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground glow-primary">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BasX SHOP — Cheat Store" },
      { name: "description", content: "BasX SHOP ร้านขายโปรฟีฟาย" },
      { property: "og:title", content: "BasX SHOP — Cheat Store" },
      { name: "twitter:title", content: "BasX SHOP — Cheat Store" },
      { property: "og:description", content: "BasX SHOP ร้านขายโปรฟีฟาย" },
      { name: "twitter:description", content: "BasX SHOP ร้านขายโปรฟีฟาย" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/WwDC6yddXDNniat2vugl2TM1Vlv1/social-images/social-1777665995336-ChatGPT_Image_1_พ.ค._2569_09_51_04.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/WwDC6yddXDNniat2vugl2TM1Vlv1/social-images/social-1777665995336-ChatGPT_Image_1_พ.ค._2569_09_51_04.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <StoreProvider>
      <Layout>
        <Outlet />
      </Layout>
      <Toaster richColors position="top-center" />
    </StoreProvider>
  );
}
