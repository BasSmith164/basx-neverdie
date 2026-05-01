import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, fileToDataUrl } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, Banknote, Gift, Copy } from "lucide-react";

export const Route = createFileRoute("/topup")({
  component: TopUpPage,
});

function TopUpPage() {
  const { settings, currentUser, submitTopUp } = useStore();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(100);
  const [slipImage, setSlipImage] = useState<string>("");
  const [giftLink, setGiftLink] = useState("");
  const [bankId, setBankId] = useState(settings.banks[0]?.id || "");

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <p>กรุณาเข้าสู่ระบบเพื่อเติมเงิน</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/login" })}>เข้าสู่ระบบ</Button>
      </div>
    );
  }

  const handleSlip = async (file: File) => {
    const url = await fileToDataUrl(file);
    setSlipImage(url);
  };

  const submitBank = () => {
    if (amount <= 0) return toast.error("จำนวนเงินไม่ถูกต้อง");
    if (!slipImage) return toast.error("กรุณาอัปโหลดสลิป");
    const r = submitTopUp({ method: "bank", amount, slipImage });
    if (!r.ok) return toast.error(r.error || "ส่งคำขอไม่สำเร็จ");
    toast.success("ส่งคำขอเติมเงินแล้ว รอแอดมินตรวจสอบ");
    setSlipImage(""); setAmount(100);
  };

  const submitWallet = () => {
    if (amount <= 0) return toast.error("จำนวนเงินไม่ถูกต้อง");
    if (!giftLink.includes("truemoney") && !giftLink.includes("gift.truemoney") && !giftLink.startsWith("http"))
      return toast.error("กรุณาใส่ลิงก์ซองวอเลทที่ถูกต้อง");
    const r = submitTopUp({ method: "truewallet", amount, giftLink });
    if (!r.ok) return toast.error(r.error || "ส่งคำขอไม่สำเร็จ");
    toast.success("ส่งซองวอเลทแล้ว รอแอดมินตรวจสอบ");
    setGiftLink(""); setAmount(100);
  };

  const bank = settings.banks.find((b) => b.id === bankId) || settings.banks[0];

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold glow-text">เติมเงิน — Top Up</h1>
      <p className="text-sm text-muted-foreground">เลือกช่องทางการเติมเงินที่คุณต้องการ</p>

      <Card className="mt-6 p-6 border-primary/40 glow-primary">
        <Tabs defaultValue="bank">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank"><Banknote className="h-4 w-4 mr-2" />โอนผ่านธนาคาร</TabsTrigger>
            <TabsTrigger value="wallet"><Wallet className="h-4 w-4 mr-2" />TrueWallet (ซองของขวัญ)</TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4 mt-4">
            {settings.banks.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีบัญชีธนาคาร</p>
            ) : (
              <>
                <div>
                  <Label>เลือกธนาคาร</Label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-input px-3 py-2 text-sm"
                  >
                    {settings.banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.bankName} — {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
                {bank && (
                  <div className="rounded-md border border-primary/40 p-4 space-y-1">
                    <p className="text-sm">ธนาคาร: <b>{bank.bankName}</b></p>
                    <p className="text-sm">ชื่อบัญชี: <b>{bank.accountName}</b></p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">เลขบัญชี:</span>
                      <b className="text-primary glow-text">{bank.accountNumber}</b>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(bank.accountNumber); toast.success("คัดลอกแล้ว"); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <Label>จำนวนเงิน (บาท)</Label>
                  <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <div>
                  <Label>อัปโหลดสลิป (บังคับ)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleSlip(e.target.files[0])} />
                  {slipImage && <img src={slipImage} alt="slip" className="mt-2 max-h-48 rounded border border-border" />}
                </div>
                <Button onClick={submitBank} className="w-full gradient-primary text-primary-foreground glow-primary">
                  ส่งคำขอเติมเงิน
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4 mt-4">
            <div className="rounded-md border border-primary/40 p-4 text-sm">
              <Gift className="h-4 w-4 inline mr-2 text-primary" />
              ส่งซองของขวัญ TrueMoney มาที่ลิงก์ระบบ — แอดมินจะตรวจสอบและเติมเงินเข้า Wallet ให้
              {settings.truewalletPhone && <p className="mt-2">📞 เบอร์รับซอง: <b>{settings.truewalletPhone}</b></p>}
              {settings.truewalletBotEnabled && <p className="mt-1 text-primary">⚡ ระบบบอทรับซองอัตโนมัติเปิดอยู่</p>}
            </div>
            <div>
              <Label>จำนวนเงินในซอง (บาท)</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>ลิงก์ซองของขวัญ TrueWallet</Label>
              <Input value={giftLink} onChange={(e) => setGiftLink(e.target.value)} placeholder="https://gift.truemoney.com/campaign/?v=..." />
            </div>
            <Button onClick={submitWallet} className="w-full gradient-primary text-primary-foreground glow-primary">
              ส่งซองและเติมเงิน
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
