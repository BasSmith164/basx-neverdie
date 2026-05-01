import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useStore();
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await register(u, p, c);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error || "สมัครไม่สำเร็จ");
      return;
    }
    toast.success("สมัครสมาชิกสำเร็จ");
    navigate({ to: "/" });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="p-8 border-primary/40 glow-primary">
        <h1 className="text-2xl font-bold text-center glow-text">สมัครสมาชิก</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Register</p>
        <form onSubmit={submit} className="mt-6 space-y-4" autoComplete="off">
          <div>
            <Label htmlFor="u">ชื่อผู้ใช้ (Username)</Label>
            <Input
              id="u" type="text" value={u} onChange={(e) => setU(e.target.value)}
              autoComplete="off" autoCorrect="off" spellCheck={false} autoCapitalize="off" required
            />
          </div>
          <div>
            <Label htmlFor="p">รหัสผ่าน (Password)</Label>
            <Input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="new-password" required />
          </div>
          <div>
            <Label htmlFor="c">ยืนยันรหัสผ่าน (Confirm Password)</Label>
            <Input id="c" type="password" value={c} onChange={(e) => setC(e.target.value)} autoComplete="new-password" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground glow-primary">
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            มีบัญชีแล้ว? <Link to="/login" className="text-primary font-semibold hover:underline">เข้าสู่ระบบ</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
