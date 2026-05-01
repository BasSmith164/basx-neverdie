import { Link, useNavigate } from "@tanstack/react-router";
import { useStore, useCurrentUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Home, Wallet, ShoppingBag, History, MessageCircle, LogOut, User as UserIcon, Shield } from "lucide-react";

export function Header() {
  const { settings, currentUser, isAdmin, logout } = useStore();
  const user = useCurrentUser();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/85 border-b border-border">
      <div className="container mx-auto flex items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {settings.logo ? (
            <img src={settings.logo} alt={settings.shopName} className="h-10 w-10 rounded object-contain glow-primary" />
          ) : (
            <div className="h-10 w-10 rounded gradient-primary glow-primary" />
          )}
          <span className="text-lg font-bold glow-text">{settings.shopName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavLink to="/" icon={<Home className="h-4 w-4" />}>หน้าหลัก</NavLink>
          <NavLink to="/topup" icon={<Wallet className="h-4 w-4" />}>เติมเงิน</NavLink>
          <NavLink to="/shop" icon={<ShoppingBag className="h-4 w-4" />}>ร้านค้า</NavLink>
          <NavLink to="/profile" icon={<History className="h-4 w-4" />}>ประวัติ</NavLink>
          <NavLink to="/contact" icon={<MessageCircle className="h-4 w-4" />}>ติดต่อเรา</NavLink>
          {isAdmin && (
            <NavLink to="/admin" icon={<Shield className="h-4 w-4" />}>หลังบ้าน</NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  {isAdmin ? "ADMIN" : currentUser}
                  {user && <span className="text-primary font-semibold">{user.wallet.toFixed(0)}฿</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                    โปรไฟล์
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    หลังบ้าน
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/" }); }}>
                  <LogOut className="h-4 w-4 mr-2" /> ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="gradient-primary text-primary-foreground glow-primary">
              <Link to="/login">เข้าสู่ระบบ / สมัคร</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children, icon }: { to: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors"
      activeProps={{ className: "bg-primary text-primary-foreground glow-primary" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon}{children}
    </Link>
  );
}
