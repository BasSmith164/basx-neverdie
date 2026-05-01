import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, useCurrentUser } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Smartphone, Apple, Monitor, ArrowLeft } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const { products, applyPromo, buy, currentUser } = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>ไม่พบสินค้า</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/shop">กลับร้านค้า</Link></Button>
      </div>
    );
  }

  const base = product.salePrice ?? product.price;
  const final = Math.round(base * (1 - discount / 100));
  const inStock = product.stock.length > 0;

  const checkCode = () => {
    const r = applyPromo(product.id, code);
    if (!r.ok) {
      toast.error(r.error || "โค้ดไม่ถูกต้อง");
      setDiscount(0);
      return;
    }
    setDiscount(r.discountPercent);
    toast.success(`ใช้โค้ดสำเร็จ ลด ${r.discountPercent}%`);
  };

  const confirmBuy = () => {
    if (!currentUser) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      navigate({ to: "/login" });
      return;
    }
    const r = buy(product.id, code || undefined);
    if (!r.ok) {
      toast.error(r.error || "ซื้อไม่สำเร็จ");
      return;
    }
    toast.success("ซื้อสำเร็จ! ดูสินค้าได้ที่ประวัติ");
    setOpen(false);
    navigate({ to: "/profile" });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Button asChild variant="ghost" className="mb-4"><Link to="/shop"><ArrowLeft className="h-4 w-4 mr-2" />กลับร้านค้า</Link></Button>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-primary/40 p-0 glow-primary">
          <div className="aspect-[4/3] bg-secondary flex items-center justify-center overflow-hidden">
            {product.image
              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              : <div className="text-muted-foreground">ไม่มีรูปภาพ</div>}
          </div>
        </Card>
        <Card className="p-6 border-primary/40">
          <div className="flex gap-2 items-center">
            {product.platforms.includes("android") && <Badge variant="outline"><Smartphone className="h-3 w-3 mr-1" />Android</Badge>}
            {product.platforms.includes("ios") && <Badge variant="outline"><Apple className="h-3 w-3 mr-1" />iOS</Badge>}
            {product.platforms.includes("pc") && <Badge variant="outline"><Monitor className="h-3 w-3 mr-1" />PC</Badge>}
            <Badge>{product.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold mt-3">{product.name}</h1>
          <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">{product.description}</p>

          <div className="mt-4 flex items-end gap-3">
            {product.salePrice && (
              <div className="text-lg line-through text-muted-foreground">{product.price}฿</div>
            )}
            <div className="text-3xl font-extrabold text-primary glow-text">{base}฿</div>
          </div>

          <div className="mt-6 text-sm">
            สถานะ: {inStock
              ? <span className="text-primary font-semibold">เหลือ {product.stock.length} ชิ้น</span>
              : <span className="text-destructive font-semibold">สินค้าหมด</span>}
          </div>

          <Button
            disabled={!inStock}
            onClick={() => setOpen(true)}
            className="w-full mt-4 gradient-primary text-primary-foreground glow-primary"
          >
            {inStock ? "สั่งซื้อตอนนี้" : "สินค้าหมด"}
          </Button>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการสั่งซื้อ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>สินค้า:</span><span className="font-semibold">{product.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>ราคาเริ่มต้น:</span><span>{base}฿</span>
            </div>
            {product.promoCodeId && (
              <div className="space-y-2">
                <Label>มีโค้ดส่วนลด? (ไม่บังคับ)</Label>
                <div className="flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ใส่โค้ด" />
                  <Button type="button" variant="outline" onClick={checkCode}>ใช้โค้ด</Button>
                </div>
                {discount > 0 && <p className="text-xs text-primary">ลด {discount}%</p>}
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
              <span>ยอดที่ต้องชำระ:</span><span className="text-primary glow-text">{final}฿</span>
            </div>
            {user && (
              <p className="text-xs text-muted-foreground">ยอดเงินคงเหลือใน Wallet: {user.wallet}฿</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={confirmBuy} className="gradient-primary text-primary-foreground glow-primary">ยืนยันซื้อ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
