import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Platform } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
});

function ShopPage() {
  const { products } = useStore();
  const [filter, setFilter] = useState<Platform | "all">("all");
  const [q, setQ] = useState("");

  const filtered = products.filter((p) => {
    const matchPlatform = filter === "all" || p.platforms.includes(filter);
    const matchQuery = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase());
    return matchPlatform && matchQuery;
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold glow-text">ร้านค้า</h1>
        <p className="text-sm text-muted-foreground">เลือกสินค้าที่คุณสนใจ</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(["all", "android", "ios", "pc"] as const).map((k) => (
          <Button
            key={k}
            variant={filter === k ? "default" : "outline"}
            className={filter === k ? "gradient-primary text-primary-foreground glow-primary" : "border-primary/40"}
            onClick={() => setFilter(k)}
          >
            {k === "all" ? "ทั้งหมด" : k.toUpperCase()}
          </Button>
        ))}
        <Input
          placeholder="ค้นหา..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">ไม่พบสินค้า</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      <div className="text-center pt-4">
        <Button asChild variant="outline"><Link to="/">กลับหน้าหลัก</Link></Button>
      </div>
    </div>
  );
}
