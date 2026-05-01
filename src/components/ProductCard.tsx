import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/store";
import { Smartphone, Apple, Monitor } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.stock.length > 0;
  const finalPrice = product.salePrice ?? product.price;
  const discounted = product.salePrice && product.salePrice < product.price;

  return (
    <Card className="relative overflow-hidden card-hover border-primary/30 p-0">
      {product.hot && (
        <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground">HOT</Badge>
      )}
      <div className="aspect-[4/3] bg-secondary flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-muted-foreground text-sm">ไม่มีรูปภาพ</div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          {product.platforms.includes("android") && <Smartphone className="h-4 w-4 text-primary" />}
          {product.platforms.includes("ios") && <Apple className="h-4 w-4 text-primary" />}
          {product.platforms.includes("pc") && <Monitor className="h-4 w-4 text-primary" />}
          <span className="text-xs text-muted-foreground">{product.category}</span>
        </div>
        <h3 className="font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="flex items-center justify-between">
          <div>
            {discounted && (
              <div className="text-xs line-through text-muted-foreground">{product.price}฿</div>
            )}
            <div className="text-xl font-bold text-primary glow-text">{finalPrice}฿</div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {inStock ? <>เหลือ <b className="text-foreground">{product.stock.length}</b> ชิ้น</> : <span className="text-destructive font-semibold">สินค้าหมด</span>}
          </div>
        </div>
        <Button asChild disabled={!inStock} className="w-full gradient-primary text-primary-foreground glow-primary">
          <Link to="/product/$id" params={{ id: product.id }}>
            {inStock ? "สั่งซื้อตอนนี้" : "สินค้าหมด"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
