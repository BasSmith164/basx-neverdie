import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(u, p);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error || "ล็อกอินไม่สำเร็จ");
      return;
    }
    toast.success("เข้าสู่ระบบสำเร็จ");
    if (u === "BASX") navigate({ to: "/admin" });
    else navigate({ to: "/" });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card className="p-8 border-primary/40 glow-primary">
        <h1 className="text-2xl font-bold text-center glow-text">เข้าสู่ระบบ</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Login</p>
        <form onSubmit={submit} className="mt-6 space-y-4" autoComplete="off">
          <div>
            <Label htmlFor="u">ชื่อผู้ใช้ (Username)</Label>
            <Input
              id="u"
              type="text"
              value={u}
              onChange={(e) => setU(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoCapitalize="off"
              required
            />
          </div>
          <div>
            <Label htmlFor="p">รหัสผ่าน (Password)</Label>
            <Input
              id="p"
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground glow-primary">
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            ยังไม่มีบัญชี? <Link to="/register" className="text-primary font-semibold hover:underline">สมัครสมาชิก</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
