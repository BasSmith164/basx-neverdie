import { useStore } from "@/lib/store";

export function Footer() {
  const { settings } = useStore();
  return (
    <footer className="border-t border-border mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {settings.shopName} — All rights reserved.
      </div>
    </footer>
  );
}
