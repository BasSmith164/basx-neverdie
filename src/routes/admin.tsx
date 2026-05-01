import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, fileToDataUrl, type Product, type Platform, type DeliveryType, type DeliveryItem, type BankAccount, type PromoCode } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2, Plus, ImagePlus, Check, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const store = useStore();
  const navigate = useNavigate();

  if (!store.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 text-center max-w-md">
        <h1 className="text-2xl font-bold">เฉพาะแอดมินเท่านั้น</h1>
        <p className="text-sm text-muted-foreground mt-2">กรุณาเข้าสู่ระบบในฐานะแอดมิน</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/login" })}>เข้าสู่ระบบ</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold glow-text">หลังบ้าน — Admin Panel</h1>
        <p className="text-sm text-muted-foreground">ปรับแต่งทุกอย่างของเว็บแบบเรียลไทม์</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">สินค้า</TabsTrigger>
          <TabsTrigger value="promo">โค้ดส่วนลด</TabsTrigger>
          <TabsTrigger value="topups">เติมเงิน</TabsTrigger>
          <TabsTrigger value="users">ผู้ใช้</TabsTrigger>
          <TabsTrigger value="site">ตั้งค่าเว็บ</TabsTrigger>
          <TabsTrigger value="theme">ธีม / สี</TabsTrigger>
          <TabsTrigger value="particles">เอฟเฟกต์</TabsTrigger>
          <TabsTrigger value="banks">ธนาคาร / บอท</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><Dashboard /></TabsContent>
        <TabsContent value="products"><ProductsTab /></TabsContent>
        <TabsContent value="promo"><PromoTab /></TabsContent>
        <TabsContent value="topups"><TopUpsTab /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="site"><SiteTab /></TabsContent>
        <TabsContent value="theme"><ThemeTab /></TabsContent>
        <TabsContent value="particles"><ParticlesTab /></TabsContent>
        <TabsContent value="banks"><BanksTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Dashboard() {
  const { users, purchases, topUps, products } = useStore();
  const totalRevenue = purchases.reduce((s, p) => s + p.price, 0);
  const pendingTopups = topUps.filter((t) => t.status === "pending").length;
  const lowStock = products.filter((p) => p.stock.length <= 2).length;
  
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <StatCard label="ผู้ใช้ทั้งหมด" value={users.length} />
      <StatCard label="ยอดขายรวม" value={`${totalRevenue}฿`} />
      <StatCard label="คำขอเติมเงินรอตรวจ" value={pendingTopups} />
      <StatCard label="สินค้าใกล้หมดสต็อก" value={lowStock} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5 border-primary/40">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold text-primary glow-text mt-2">{value}</div>
    </Card>
  );
}

// ---------------- Products ----------------
function ProductsTab() {
  const { products, promoCodes, update } = useStore();
  const [editing, setEditing] = useState<Product | null>(null);

  const blank = (): Product => ({
    id: Math.random().toString(36).slice(2, 10),
    name: "", category: "", platforms: ["android"], image: "",
    price: 0, salePrice: null, description: "", deliveryType: "key",
    stock: [], promoCodeId: null, hot: false,
  });

  const save = (p: Product) => {
    update((d) => {
      const exists = d.products.some((x) => x.id === p.id);
      return { ...d, products: exists ? d.products.map((x) => x.id === p.id ? p : x) : [p, ...d.products] };
    });
    // ส่งสัญญาณเตือนให้ระบบ Sync หน้าบ้าน
    window.dispatchEvent(new Event("storage"));
    setEditing(null);
    toast.success("บันทึกสินค้าแล้ว");
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
    window.dispatchEvent(new Event("storage"));
    toast.success("ลบสินค้าแล้ว");
  };

  return (
    <div className="space-y-4 mt-4">
      <Button onClick={() => setEditing(blank())} className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />เพิ่มสินค้าใหม่</Button>
      {editing && <ProductForm product={editing} promoCodes={promoCodes} onSave={save} onCancel={() => setEditing(null)} />}
      <div className="grid md:grid-cols-2 gap-3">
        {products.map((p) => (
          <Card key={p.id} className="p-4 border-primary/30 flex gap-3">
            <div className="h-20 w-20 rounded bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
              {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-muted-foreground">รูป</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.category} • {p.platforms.join(", ")}</div>
              <div className="text-sm text-primary font-bold mt-1">{p.salePrice ?? p.price}฿ • คงเหลือ {p.stock.length}</div>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(p)}>แก้ไข</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ product, promoCodes, onSave, onCancel }: {
  product: Product; promoCodes: PromoCode[]; onSave: (p: Product) => void; onCancel: () => void;
}) {
  const [p, setP] = useState<Product>(product);
  const [newKey, setNewKey] = useState("");
  const [newLink, setNewLink] = useState("");

  const togglePlatform = (pl: Platform) => {
    setP((x) => ({ ...x, platforms: x.platforms.includes(pl) ? x.platforms.filter((y) => y !== pl) : [...x.platforms, pl] }));
  };

  const handleImage = async (file: File) => {
    const url = await fileToDataUrl(file);
    setP((x) => ({ ...x, image: url }));
  };

  const addStock = () => {
    const item: DeliveryItem = {};
    if (p.deliveryType === "key" || p.deliveryType === "both") {
      if (!newKey.trim()) return toast.error("ใส่คีย์ก่อน");
      item.key = newKey.trim();
    }
    if (p.deliveryType === "link" || p.deliveryType === "both") {
      if (!newLink.trim()) return toast.error("ใส่ลิงก์ก่อน");
      item.link = newLink.trim();
    }
    setP((x) => ({ ...x, stock: [...x.stock, item] }));
    setNewKey(""); setNewLink("");
  };

  const removeStock = (i: number) => setP((x) => ({ ...x, stock: x.stock.filter((_, idx) => idx !== i) }));

  return (
    <Card className="p-6 border-primary glow-primary space-y-4">
      <h3 className="font-bold text-lg">{product.name ? `แก้ไข: ${product.name}` : "เพิ่มสินค้าใหม่"}</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>ชื่อสินค้า</Label>
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </div>
        <div>
          <Label>หมวดหมู่</Label>
          <Input value={p.category} onChange={(e) => setP({ ...p, category: e.target.value })} placeholder="เช่น Mod Menu / Free Fire" />
        </div>
        <div>
          <Label>ราคา (บาท)</Label>
          <Input type="number" value={p.price} onChange={(e) => setP({ ...p, price: Number(e.target.value) })} />
        </div>
        <div>
          <Label>ราคาลด (เว้นว่างถ้าไม่ลด)</Label>
          <Input type="number" value={p.salePrice ?? ""} onChange={(e) => setP({ ...p, salePrice: e.target.value ? Number(e.target.value) : null })} />
        </div>
      </div>

      <div>
        <Label>แพลตฟอร์ม</Label>
        <div className="flex gap-3 mt-2">
          {(["android", "ios", "pc"] as Platform[]).map((pl) => (
            <label key={pl} className="flex items-center gap-2 text-sm">
              <Checkbox checked={p.platforms.includes(pl)} onCheckedChange={() => togglePlatform(pl)} />
              {pl.toUpperCase()}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm ml-4">
            <Checkbox checked={p.hot || false} onCheckedChange={(v) => setP({ ...p, hot: !!v })} />
            HOT 🔥
          </label>
        </div>
      </div>

      <div>
        <Label>คำอธิบาย</Label>
        <Textarea value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} rows={3} />
      </div>

      <div>
        <Label>รูปสินค้า (อัปโหลดจากเครื่อง)</Label>
        <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])} />
        {p.image && <img src={p.image} alt="" className="mt-2 max-h-40 rounded border border-border" />}
      </div>

      <div>
        <Label>โค้ดส่วนลดที่ใช้กับสินค้านี้</Label>
        <select
          value={p.promoCodeId || ""}
          onChange={(e) => setP({ ...p, promoCodeId: e.target.value || null })}
          className="w-full mt-1 rounded-md border border-input bg-input px-3 py-2 text-sm"
        >
          <option value="">— ไม่ใช้โค้ด —</option>
          {promoCodes.map((c) => <option key={c.id} value={c.id}>{c.code} (ลด {c.discountPercent}%)</option>)}
        </select>
      </div>

      <div className="border-t border-border pt-4">
        <Label className="text-base font-semibold">ลูกค้าซื้อแล้วได้อะไร?</Label>
        <div className="flex gap-2 mt-2">
          {(["key", "link", "both"] as DeliveryType[]).map((d) => (
            <Button key={d} type="button" size="sm" variant={p.deliveryType === d ? "default" : "outline"}
              className={p.deliveryType === d ? "gradient-primary text-primary-foreground" : ""}
              onClick={() => setP({ ...p, deliveryType: d, stock: [] })}>
              {d === "key" ? "คีย์อย่างเดียว" : d === "link" ? "ลิงก์อย่างเดียว" : "คีย์ + ลิงก์"}
            </Button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <Label>เพิ่มสต็อก (1 รายการ = 1 ชิ้น)</Label>
          <div className="grid md:grid-cols-2 gap-2">
            {(p.deliveryType === "key" || p.deliveryType === "both") && (
              <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="คีย์" />
            )}
            {(p.deliveryType === "link" || p.deliveryType === "both") && (
              <Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="ลิงก์ดาวน์โหลด" />
            )}
          </div>
          <Button type="button" onClick={addStock} variant="outline"><Plus className="h-3 w-3 mr-1" />เพิ่มเข้าสต็อก</Button>
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-xs text-muted-foreground">สต็อกปัจจุบัน: {p.stock.length} ชิ้น</p>
          {p.stock.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-secondary/40 rounded p-2">
              {s.key && <Badge variant="outline">คีย์: {s.key}</Badge>}
              {s.link && <Badge variant="outline" className="truncate max-w-xs">ลิงก์: {s.link}</Badge>}
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => removeStock(i)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>ยกเลิก</Button>
        <Button onClick={() => onSave(p)} className="gradient-primary text-primary-foreground glow-primary">บันทึก</Button>
      </div>
    </Card>
  );
}

// ---------------- Promo ----------------
function PromoTab() {
  const { promoCodes, update } = useStore();
  const [code, setCode] = useState(""); const [pct, setPct] = useState(10);
  
  const add = () => {
    if (!code.trim()) return;
    const c: PromoCode = { id: Math.random().toString(36).slice(2, 10), code: code.trim(), discountPercent: pct };
    update((d) => ({ ...d, promoCodes: [c, ...d.promoCodes] }));
    window.dispatchEvent(new Event("storage"));
    setCode(""); setPct(10); toast.success("เพิ่มโค้ดแล้ว");
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, promoCodes: d.promoCodes.filter((c) => c.id !== id) }));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <Card className="p-6 border-primary/40 mt-4 space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1"><Label>รหัสโค้ด</Label><Input value={code} onChange={(e) => setCode(e.target.value)} /></div>
        <div className="w-32"><Label>ลด %</Label><Input type="number" min={1} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} /></div>
        <Button onClick={add} className="gradient-primary text-primary-foreground">เพิ่ม</Button>
      </div>
      <div className="space-y-2">
        {promoCodes.map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 rounded border border-border">
            <Badge className="bg-primary text-primary-foreground">{c.code}</Badge>
            <span className="text-sm">ลด {c.discountPercent}%</span>
            <Button size="sm" variant="destructive" className="ml-auto" onClick={() => remove(c.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------------- TopUps ----------------
function TopUpsTab() {
  const { topUps, approveTopUp, rejectTopUp } = useStore();
  
  const approveWithSync = (id: string) => {
    approveTopUp(id);
    window.dispatchEvent(new Event("storage"));
    toast.success("อนุมัติแล้ว");
  };

  const rejectWithSync = (id: string, reason: string) => {
    rejectTopUp(id, reason);
    window.dispatchEvent(new Event("storage"));
    toast.success("ปฏิเสธแล้ว");
  };

  return (
    <div className="space-y-3 mt-4">
      {topUps.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีรายการ</p>}
      {topUps.map((t) => (
        <Card key={t.id} className="p-4 border-primary/30">
          <div className="flex flex-wrap gap-3 items-start">
            <div className="flex-1 min-w-[200px]">
              <div className="font-semibold">{t.username} — {t.amount}฿</div>
              <div className="text-xs text-muted-foreground">{t.method === "bank" ? "ธนาคาร" : "TrueWallet"} • {new Date(t.createdAt).toLocaleString("th-TH")}</div>
              {t.giftLink && <a href={t.giftLink} target="_blank" rel="noreferrer" className="text-xs text-primary underline break-all">{t.giftLink}</a>}
            </div>
            {t.slipImage && <img src={t.slipImage} alt="" className="max-h-32 rounded border border-border" />}
            <div className="flex flex-col gap-2">
              <Badge className={t.status === "approved" ? "bg-primary text-primary-foreground" : t.status === "rejected" ? "bg-destructive text-destructive-foreground" : "bg-secondary"}>
                {t.status}
              </Badge>
              {t.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => approveWithSync(t.id)}><Check className="h-3 w-3 mr-1" />อนุมัติ</Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectWithSync(t.id, "ไม่ผ่านตรวจสอบ")}><X className="h-3 w-3 mr-1" />ปฏิเสธ</Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Users ----------------
function UsersTab() {
  const { users, update } = useStore();
  
  const adjust = (username: string, delta: number) => {
    update((d) => ({ ...d, users: d.users.map((u) => u.username === username ? { ...u, wallet: Math.max(0, u.wallet + delta) } : u) }));
    window.dispatchEvent(new Event("storage"));
  };

  const remove = (username: string) => {
    update((d) => ({ ...d, users: d.users.filter((u) => u.username !== username) }));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="space-y-2 mt-4">
      {users.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีผู้ใช้</p>}
      {users.map((u) => (
        <Card key={u.username} className="p-3 border-primary/30 flex items-center gap-3 flex-wrap">
          <div className="flex-1">
            <div className="font-semibold">{u.username}</div>
            <div className="text-xs text-muted-foreground">Wallet: {u.wallet}฿ • เติมรวม: {u.totalTopUp}฿ • {u.points} แต้ม</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => adjust(u.username, 50)}>+50฿</Button>
          <Button size="sm" variant="outline" onClick={() => adjust(u.username, -50)}>-50฿</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(u.username)}><Trash2 className="h-3 w-3" /></Button>
        </Card>
      ))}
    </div>
  );
}

// ---------------- Site ----------------
function SiteTab() {
  const { settings, update } = useStore();
  const [logoFile, setLogoFile] = useState<string>("");
  
  const handleLogo = async (f: File) => {
    const url = await fileToDataUrl(f);
    setLogoFile(url);
    update((d) => ({ ...d, settings: { ...d.settings, logo: url } }));
    window.dispatchEvent(new Event("storage"));
    toast.success("เปลี่ยนโลโก้แล้ว");
  };

  const setField = <K extends keyof typeof settings>(k: K, v: (typeof settings)[K]) => {
    update((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));
    window.dispatchEvent(new Event("storage"));
  };

  const addBanner = async (f: File) => {
    const url = await fileToDataUrl(f);
    update((d) => ({ ...d, settings: { ...d.settings, banners: [{ id: Math.random().toString(36).slice(2), image: url }, ...d.settings.banners] } }));
    window.dispatchEvent(new Event("storage"));
    toast.success("เพิ่มแบนเนอร์แล้ว");
  };

  const removeBanner = (id: string) => {
    update((d) => ({ ...d, settings: { ...d.settings, banners: d.settings.banners.filter((b) => b.id !== id) } }));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <Card className="p-6 border-primary/40 mt-4 space-y-4">
      <div>
        <Label>ชื่อร้าน</Label>
        <Input value={settings.shopName} onChange={(e) => setField("shopName", e.target.value)} />
      </div>
      <div>
        <Label>โลโก้ร้าน (อัปโหลดจากเครื่อง)</Label>
        <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
        {(logoFile || settings.logo) && <img src={logoFile || settings.logo} alt="" className="mt-2 h-20 rounded border border-border" />}
      </div>
      <div>
        <Label>ลิงก์ Discord</Label>
        <Input value={settings.discordUrl} onChange={(e) => setField("discordUrl", e.target.value)} />
      </div>
      <div className="border-t border-border pt-4">
        <Label className="text-base font-semibold">ประกาศจากทางร้าน</Label>
        <Input className="mt-2" value={settings.announcement.title} onChange={(e) => setField("announcement", { ...settings.announcement, title: e.target.value })} placeholder="หัวข้อประกาศ" />
        <Textarea className="mt-2" rows={3} value={settings.announcement.body} onChange={(e) => setField("announcement", { ...settings.announcement, body: e.target.value })} />
        <Input className="mt-2" type="date" value={settings.announcement.date} onChange={(e) => setField("announcement", { ...settings.announcement, date: e.target.value })} />
      </div>
      <div className="border-t border-border pt-4">
        <Label className="text-base font-semibold">แบนเนอร์โปรโมชั่นหน้าหลัก</Label>
        <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && addBanner(e.target.files[0])} className="mt-2" />
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {settings.banners.map((b) => (
            <div key={b.id} className="relative">
              <img src={b.image} alt="" className="rounded border border-border w-full h-32 object-cover" />
              <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => removeBanner(b.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---------------- Theme ----------------
function ThemeTab() {
  const { settings, update } = useStore();
  const t = settings.theme;
  
  const setT = (k: keyof typeof t, v: number | string) => {
    update((d) => ({ ...d, settings: { ...d.settings, theme: { ...d.settings.theme, [k]: v } } }));
    window.dispatchEvent(new Event("storage"));
  };

  const presets = [
    { name: "Cyber Blue", hue: 235, chroma: 0.18, bg: "oklch(0.13 0.02 250)", surf: "oklch(0.17 0.03 250)", card: "oklch(0.18 0.04 250)" },
    { name: "Daemonic Purple", hue: 295, chroma: 0.2, bg: "oklch(0.12 0.02 295)", surf: "oklch(0.16 0.04 295)", card: "oklch(0.18 0.05 295)" },
    { name: "Toxic Green", hue: 145, chroma: 0.18, bg: "oklch(0.12 0.02 145)", surf: "oklch(0.16 0.03 145)", card: "oklch(0.18 0.04 145)" },
    { name: "Crimson", hue: 25, chroma: 0.2, bg: "oklch(0.13 0.02 25)", surf: "oklch(0.17 0.03 25)", card: "oklch(0.19 0.04 25)" },
  ];

  return (
    <Card className="p-6 border-primary/40 mt-4 space-y-4">
      <div>
        <Label>เลือกธีมสำเร็จรูป</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {presets.map((p) => (
            <Button key={p.name} variant="outline" onClick={() => {
              update((d) => ({
                ...d, settings: { ...d.settings, theme: { primaryHue: p.hue, primaryChroma: p.chroma, background: p.bg, surface: p.surf, card: p.card } }
              }));
              window.dispatchEvent(new Event("storage"));
            }}>
              {p.name}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label>โทนสีหลัก (Hue: {t.primaryHue}°)</Label>
        <Slider min={0} max={360} step={1} value={[t.primaryHue]} onValueChange={(v) => setT("primaryHue", v[0])} />
      </div>
      <div>
        <Label>ความเข้มของสี (Chroma: {t.primaryChroma.toFixed(2)})</Label>
        <Slider min={0.05} max={0.3} step={0.01} value={[t.primaryChroma]} onValueChange={(v) => setT("primaryChroma", v[0])} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <Label>สีพื้นหลัง (oklch)</Label>
          <Input value={t.background} onChange={(e) => setT("background", e.target.value)} />
        </div>
        <div>
          <Label>สีพื้นผิว</Label>
          <Input value={t.surface} onChange={(e) => setT("surface", e.target.value)} />
        </div>
        <div>
          <Label>สีการ์ด</Label>
          <Input value={t.card} onChange={(e) => setT("card", e.target.value)} />
        </div>
      </div>
      <div className="rounded-md border border-primary p-4 glow-primary">
        <p className="text-sm">ตัวอย่างแบบเรียลไทม์ — สีจะเปลี่ยนทันทีที่คุณปรับ</p>
        <Button className="mt-2 gradient-primary text-primary-foreground glow-primary">ปุ่มตัวอย่าง</Button>
      </div>
    </Card>
  );
}

// ---------------- Particles ----------------
function ParticlesTab() {
  const { settings, update } = useStore();
  const p = settings.particles;
  
  const setP = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) => {
    update((d) => ({ ...d, settings: { ...d.settings, particles: { ...d.settings.particles, [k]: v } } }));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <Card className="p-6 border-primary/40 mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <Label>เปิดเอฟเฟกต์</Label>
        <Switch checked={p.enabled} onCheckedChange={(v) => setP("enabled", v)} />
      </div>
      <div>
        <Label>รูปทรงอนุภาค</Label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {(["snow", "sakura", "star", "dot"] as const).map((s) => (
            <Button key={s} variant={p.shape === s ? "default" : "outline"}
              className={p.shape === s ? "gradient-primary text-primary-foreground" : ""}
              onClick={() => setP("shape", s)}>
              {s === "snow" ? "❄️ หิมะ" : s === "sakura" ? "🌸 ซากุระ" : s === "star" ? "⭐ ดาว" : "● จุด"}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label>จำนวน ({p.count} ชิ้น)</Label>
        <Slider min={10} max={250} step={5} value={[p.count]} onValueChange={(v) => setP("count", v[0])} />
      </div>
      <div>
        <Label>ความเร็ว ({p.speed.toFixed(2)})</Label>
        <Slider min={0.3} max={4} step={0.1} value={[p.speed]} onValueChange={(v) => setP("speed", v[0])} />
      </div>
      <div>
        <Label>ขนาด ({p.size}px)</Label>
        <Slider min={3} max={20} step={1} value={[p.size]} onValueChange={(v) => setP("size", v[0])} />
      </div>
    </Card>
  );
}

// ---------------- Banks ----------------
function BanksTab() {
  const { settings, update } = useStore();
  const [b, setB] = useState<BankAccount>({ id: "", bankName: "", accountName: "", accountNumber: "" });
  
  const add = () => {
    if (!b.bankName || !b.accountNumber) return toast.error("กรอกข้อมูลให้ครบ");
    const id = Math.random().toString(36).slice(2);
    update((d) => ({ ...d, settings: { ...d.settings, banks: [...d.settings.banks, { ...b, id }] } }));
    window.dispatchEvent(new Event("storage"));
    setB({ id: "", bankName: "", accountName: "", accountNumber: "" });
    toast.success("เพิ่มบัญชีแล้ว");
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, settings: { ...d.settings, banks: d.settings.banks.filter((x) => x.id !== id) } }));
    window.dispatchEvent(new Event("storage"));
  };
  
  const setSetting = <K extends keyof typeof settings>(k: K, v: (typeof settings)[K]) => {
    update((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-6 border-primary/40 space-y-3">
        <h3 className="font-semibold">บอทเช็คสลิป (Bank)</h3>
        <div className="flex items-center justify-between">
          <Label>เปิดใช้บอทเช็คสลิปอัตโนมัติ</Label>
          <Switch checked={settings.bankBotEnabled} onCheckedChange={(v) => setSetting("bankBotEnabled", v)} />
        </div>
        <p className="text-xs text-muted-foreground">หมายเหตุ: เป็นโครงสร้างสำหรับเชื่อมต่อกับ API ภายนอก เช่น SlipOK / EasySlip — ปัจจุบันยังเป็นโหมดให้แอดมินตรวจสอบเอง</p>
      </Card>

      <Card className="p-6 border-primary/40 space-y-3">
        <h3 className="font-semibold">บอทรับซอง TrueWallet</h3>
        <div className="flex items-center justify-between">
          <Label>เปิดใช้บอทรับซองอัตโนมัติ</Label>
          <Switch checked={settings.truewalletBotEnabled} onCheckedChange={(v) => setSetting("truewalletBotEnabled", v)} />
        </div>
        <div>
          <Label>เบอร์ TrueWallet ที่ใช้รับซอง</Label>
          <Input value={settings.truewalletPhone} onChange={(e) => setSetting("truewalletPhone", e.target.value)} placeholder="0xx-xxx-xxxx" />
        </div>
        <p className="text-xs text-muted-foreground">หมายเหตุ: เป็นโครงสร้าง — ปัจจุบันรับซองและให้แอดมินยืนยัน</p>
      </Card>

      <Card className="p-6 border-primary/40 space-y-3">
        <h3 className="font-semibold">บัญชีธนาคารสำหรับโอนเงิน</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <Input placeholder="ชื่อธนาคาร" value={b.bankName} onChange={(e) => setB({ ...b, bankName: e.target.value })} />
          <Input placeholder="ชื่อบัญชี" value={b.accountName} onChange={(e) => setB({ ...b, accountName: e.target.value })} />
          <Input placeholder="เลขบัญชี" value={b.accountNumber} onChange={(e) => setB({ ...b, accountNumber: e.target.value })} />
        </div>
        <Button onClick={add} className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" />เพิ่มบัญชี</Button>
        <div className="space-y-2 pt-2">
          {settings.banks.map((bk) => (
            <div key={bk.id} className="flex items-center gap-3 p-3 rounded border border-border">
              <div className="flex-1 text-sm">
                <b>{bk.bankName}</b> • {bk.accountName} • <code className="text-primary">{bk.accountNumber}</code>
              </div>
              <Button size="sm" variant="destructive" onClick={() => remove(bk.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
