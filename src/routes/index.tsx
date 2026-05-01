import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Wallet, History, MessageCircle, Bell, Smartphone, Apple, Monitor } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { settings, products } = useStore();
  const featured = products.slice(0, 8);
  const banner = settings.banners[0];

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <section className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary glow-text" />
        <div>
          <h1 className="text-2xl font-bold">โปรโมชั่นและข่าวสาร</h1>
          <p className="text-sm text-muted-foreground">Promotion & News</p>
        </div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden border-primary/40 glow-primary p-0">
          {banner ? (
            <img src={banner.image} alt={banner.title || ""} className="w-full h-72 object-cover" />
          ) : (
            <div className="h-72 gradient-primary flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-4xl font-extrabold text-primary-foreground glow-text">{settings.shopName}</h2>
                <p className="mt-2 text-primary-foreground/90">บริการดี ปลอดภัย 100% — Android · iOS · PC</p>
              </div>
            </div>
          )}
        </Card>
        <Card className="p-5 border-primary/40">
          <h3 className="text-lg font-bold text-primary glow-text">{settings.announcement.title}</h3>
          <p className="mt-3 text-sm whitespace-pre-line">{settings.announcement.body}</p>
          <p className="mt-4 text-xs text-muted-foreground">📅 {settings.announcement.date}</p>
        </Card>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink to="/shop" icon={<ShoppingBag />} title="เลือกดูสินค้า" />
        <QuickLink to="/topup" icon={<Wallet />} title="บริการเติมเงิน" />
        <QuickLink to="/profile" icon={<History />} title="ประวัติการสั่งซื้อ" />
        <QuickLink to="/contact" icon={<MessageCircle />} title="ติดต่อ Contact" />
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">หมวดหมู่แนะนำ</h2>
            <p className="text-sm text-muted-foreground">Category Recommended</p>
          </div>
          <Button asChild variant="outline" className="border-primary text-primary">
            <Link to="/shop">เลือกดูทั้งหมด</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <CategoryCard to="/shop" platform="android" icon={<Smartphone />} title="Android" />
          <CategoryCard to="/shop" platform="ios" icon={<Apple />} title="iOS" />
          <CategoryCard to="/shop" platform="pc" icon={<Monitor />} title="PC" />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">สินค้าแนะนำ</h2>
            <p className="text-sm text-muted-foreground">Product Recommended</p>
          </div>
          <Button asChild variant="outline" className="border-primary text-primary">
            <Link to="/shop">เลือกดูทั้งหมด</Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickLink({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to} className="block">
      <Card className="card-hover border-primary/30 p-5 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground glow-primary">
          {icon}
        </div>
        <div className="font-semibold">{title}</div>
      </Card>
    </Link>
  );
}

function CategoryCard({ to, icon, title }: { to: string; platform: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to} className="block">
      <Card className="card-hover border-primary/40 p-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground glow-primary">
          {icon}
        </div>
        <h3 className="mt-4 text-xl font-bold glow-text">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">รวมโปร / Mod / Tool</p>
      </Card>
    </Link>
  );
}
