import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, useCurrentUser, sha256 } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, KeyRound, LinkIcon } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { currentUser, isAdmin, purchases, topUps, update } = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [conf, setConf] = useState("");

  if (!currentUser || isAdmin || !user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <p>กรุณาเข้าสู่ระบบ</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/login" })}>เข้าสู่ระบบ</Button>
      </div>
    );
  }

  const myPurchases = purchases.filter((p) => p.username === user.username);
  const myTopUps = topUps.filter((t) => t.username === user.username);

  const changePw = async () => {
    if (newPw.length < 4) return toast.error("รหัสใหม่สั้นเกินไป");
    if (newPw !== conf) return toast.error("รหัสใหม่ไม่ตรงกัน");
    const oldHash = await sha256(oldPw);
    if (oldHash !== user.passwordHash) return toast.error("รหัสเดิมไม่ถูกต้อง");
    const newHash = await sha256(newPw);
    update((d) => ({
      ...d,
      users: d.users.map((u) => u.username === user.username ? { ...u, passwordHash: newHash } : u),
    }));
    toast.success("เปลี่ยนรหัสผ่านแล้ว");
    setOldPw(""); setNewPw(""); setConf("");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <h1 className="text-2xl font-bold glow-text">โปรไฟล์ — Profile</h1>

      <Card className="mt-4 p-6 border-primary/40 glow-primary">
        <div className="grid md:grid-cols-3 gap-4">
          <Stat label="ชื่อผู้ใช้" value={user.username} />
          <Stat label="ยอดเงินคงเหลือ" value={`${user.wallet.toFixed(0)} ฿`} />
          <Stat label="คะแนนสะสม" value={`${user.points} แต้ม`} />
          <Stat label="ยอดเติมเงินรวม" value={`${user.totalTopUp.toFixed(0)} ฿`} />
        </div>
      </Card>

      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders">ประวัติการสั่งซื้อ</TabsTrigger>
          <TabsTrigger value="topup">ประวัติการเติมเงิน</TabsTrigger>
          <TabsTrigger value="pw">เปลี่ยนรหัสผ่าน</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-4">
          {myPurchases.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีคำสั่งซื้อ</p>}
          {myPurchases.map((p) => (
            <Card key={p.id} className="p-4 border-primary/30 flex flex-col md:flex-row gap-4 items-start">
              <div className="flex gap-3 flex-1">
                <div className="h-20 w-20 rounded bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                  {p.productImage ? <img src={p.productImage} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-muted-foreground">รูป</span>}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{p.productName}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString("th-TH")}</div>
                  <div className="text-sm mt-1">ราคา: <b className="text-primary">{p.price}฿</b></div>
                  <div className="mt-2 space-y-1.5">
                    {(p.deliveryType === "key" || p.deliveryType === "both") && p.delivered.key && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="border-primary text-primary"><KeyRound className="h-3 w-3 mr-1" />คีย์</Badge>
                        <code className="bg-secondary px-2 py-1 rounded text-xs flex-1 break-all">{p.delivered.key}</code>
                        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(p.delivered.key!); toast.success("คัดลอกแล้ว"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {(p.deliveryType === "link" || p.deliveryType === "both") && p.delivered.link && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="border-primary text-primary"><LinkIcon className="h-3 w-3 mr-1" />ลิงก์</Badge>
                        <a href={p.delivered.link} target="_blank" rel="noreferrer" className="text-primary underline text-xs flex-1 break-all">{p.delivered.link}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="topup" className="space-y-3 mt-4">
          {myTopUps.length === 0 && <p className="text-muted-foreground text-sm">ยังไม่มีรายการเติมเงิน</p>}
          {myTopUps.map((t) => (
            <Card key={t.id} className="p-4 border-primary/30 flex justify-between items-center">
              <div>
                <div className="font-semibold">
                  {t.method === "bank" ? "โอนผ่านธนาคาร" : "TrueWallet"} — {t.amount}฿
                </div>
                <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString("th-TH")}</div>
                {t.note && <div className="text-xs text-destructive mt-1">หมายเหตุ: {t.note}</div>}
              </div>
              <Badge
                className={
                  t.status === "approved" ? "bg-primary text-primary-foreground"
                  : t.status === "rejected" ? "bg-destructive text-destructive-foreground"
                  : "bg-secondary"
                }
              >
                {t.status === "approved" ? "อนุมัติแล้ว" : t.status === "rejected" ? "ไม่อนุมัติ" : "รอตรวจสอบ"}
              </Badge>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pw" className="mt-4">
          <Card className="p-6 border-primary/40 max-w-md space-y-3">
            <div>
              <Label>รหัสผ่านเดิม</Label>
              <Input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            </div>
            <div>
              <Label>รหัสผ่านใหม่</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div>
              <Label>ยืนยันรหัสผ่านใหม่</Label>
              <Input type="password" value={conf} onChange={(e) => setConf(e.target.value)} />
            </div>
            <Button onClick={changePw} className="w-full gradient-primary text-primary-foreground glow-primary">เปลี่ยนรหัสผ่าน</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold mt-1 text-primary glow-text">{value}</div>
    </div>
  );
}
