import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import logoUrl from "@/assets/logo.png";

// ---------- Types ----------
export type Platform = "android" | "ios" | "pc";
export type DeliveryType = "key" | "link" | "both";

export interface DeliveryItem {
  key?: string;
  link?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // e.g. "Free Fire", "RoV", "Mod Menu"
  platforms: Platform[];
  image: string; // data URL or http URL
  price: number;
  salePrice?: number | null;
  description: string;
  deliveryType: DeliveryType;
  stock: DeliveryItem[]; // each item = 1 unit available
  promoCodeId?: string | null; // promo code that applies
  hot?: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number; // 0-100
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface User {
  username: string;
  passwordHash: string; // sha-256 hex
  wallet: number;
  totalTopUp: number;
  points: number;
  createdAt: number;
}

export interface PurchaseRecord {
  id: string;
  username: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  delivered: DeliveryItem;
  deliveryType: DeliveryType;
  createdAt: number;
}

export interface TopUpRequest {
  id: string;
  username: string;
  method: "bank" | "truewallet";
  amount: number;
  slipImage?: string; // data URL for bank
  giftLink?: string; // truewallet
  status: "pending" | "approved" | "rejected";
  note?: string;
  createdAt: number;
}

export interface Announcement {
  title: string;
  body: string;
  date: string;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
}

export interface ParticleSettings {
  enabled: boolean;
  shape: "snow" | "sakura" | "star" | "dot";
  count: number; // 10..200
  speed: number; // 0.5..3
  size: number; // 4..18
}

export interface ThemeSettings {
  primaryHue: number; // 0-360
  primaryChroma: number; // 0-0.3
  background: string; // oklch string
  surface: string;
  card: string;
}

export interface SiteSettings {
  shopName: string;
  logo: string;
  discordUrl: string;
  announcement: Announcement;
  banners: Banner[];
  theme: ThemeSettings;
  particles: ParticleSettings;
  truewalletBotEnabled: boolean;
  truewalletPhone: string;
  bankBotEnabled: boolean;
  banks: BankAccount[];
}

interface StoreData {
  settings: SiteSettings;
  products: Product[];
  promoCodes: PromoCode[];
  users: User[];
  purchases: PurchaseRecord[];
  topUps: TopUpRequest[];
  currentUser: string | null;
  isAdmin: boolean;
}

// ---------- Helpers ----------
export async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Deterministic id generator for SSR-safe initial data
let _seedCounter = 0;
const seedId = (prefix: string) => `${prefix}-${++_seedCounter}`;

const STORAGE_KEY = "basx_shop_v2";

const defaultLogo = logoUrl;

const defaultSettings: SiteSettings = {
  shopName: "BasX SHOP",
  logo: "",
  discordUrl: "https://discord.gg/6Gev7X9xVF",
  announcement: {
    title: "ประกาศจากทางร้าน",
    body: "🛒 ซื้อสินค้าทางร้านแล้วพบปัญหา ติดต่อแอดมินผ่าน Discord ได้เลย",
    date: new Date().toISOString().slice(0, 10),
  },
  banners: [],
  theme: {
    primaryHue: 235,
    primaryChroma: 0.18,
    background: "oklch(0.13 0.02 250)",
    surface: "oklch(0.17 0.03 250)",
    card: "oklch(0.18 0.04 250)",
  },
  particles: {
    enabled: true,
    shape: "snow",
    count: 70,
    speed: 1.2,
    size: 8,
  },
  truewalletBotEnabled: false,
  truewalletPhone: "",
  bankBotEnabled: false,
  banks: [
    {
      id: "bank-default-1",
      bankName: "ธนาคารกรุงเทพ",
      accountName: "BasX SHOP",
      accountNumber: "478-4-271134",
    },
  ],
};

const sampleProducts = (): Product[] => [
  {
    id: uid(),
    name: "Fluorite Hack iOS",
    category: "Mod Menu",
    platforms: ["ios"],
    image: "",
    price: 350,
    salePrice: 300,
    description: "โปรไวต์สำหรับ iOS เกมส์ FreeFire — ใช้งานได้ 30 วัน",
    deliveryType: "both",
    stock: [
      { key: "FLU-IOS-AAAA-1111", link: "https://example.com/dl/fluorite-ios" },
      { key: "FLU-IOS-BBBB-2222", link: "https://example.com/dl/fluorite-ios" },
      { key: "FLU-IOS-CCCC-3333", link: "https://example.com/dl/fluorite-ios" },
    ],
    hot: true,
  },
  {
    id: uid(),
    name: "Gbox iOS [สำหรับติดตั้ง iPA]",
    category: "Tool",
    platforms: ["ios"],
    image: "",
    price: 250,
    salePrice: null,
    description: "Gbox สำหรับไว้ติดตั้ง iPA โปรต่าง ๆ",
    deliveryType: "key",
    stock: [{ key: "GBOX-XX-001" }, { key: "GBOX-XX-002" }],
  },
  {
    id: uid(),
    name: "PROXY PRO iOS",
    category: "Mod Menu",
    platforms: ["ios"],
    image: "",
    price: 180,
    salePrice: null,
    description: "ยิงตัวตามเมจขึ้นหัว สำหรับ iOS",
    deliveryType: "link",
    stock: [{ link: "https://example.com/dl/proxy-pro-ios" }],
  },
  {
    id: uid(),
    name: "HG Cheats Android",
    category: "Mod Menu",
    platforms: ["android"],
    image: "",
    price: 120,
    salePrice: 99,
    description: "Mod Menu สำหรับ Android",
    deliveryType: "both",
    stock: [{ key: "HG-AND-AAAA", link: "https://example.com/dl/hg-and" }],
    hot: true,
  },
  {
    id: uid(),
    name: "Aim Trainer PC",
    category: "PC Tool",
    platforms: ["pc"],
    image: "",
    price: 200,
    salePrice: null,
    description: "เครื่องมือฝึกเล็งสำหรับ PC",
    deliveryType: "key",
    stock: [{ key: "AIM-PC-001" }, { key: "AIM-PC-002" }],
  },
];

const initial = (): StoreData => ({
  settings: { ...defaultSettings, logo: defaultLogo },
  products: sampleProducts(),
  promoCodes: [{ id: uid(), code: "WELCOME10", discountPercent: 10 }],
  users: [],
  purchases: [],
  topUps: [],
  currentUser: null,
  isAdmin: false,
});

function load(): StoreData {
  if (typeof window === "undefined") return initial();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw);
    const mergedSettings = { ...defaultSettings, ...(parsed.settings || {}) };
    if (!mergedSettings.logo) mergedSettings.logo = defaultLogo;
    return { ...initial(), ...parsed, settings: mergedSettings };
  } catch {
    return initial();
  }
}

function save(data: StoreData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------- Context ----------
interface StoreCtx extends StoreData {
  update: (fn: (d: StoreData) => StoreData) => void;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    username: string,
    password: string,
    confirm: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  applyPromo: (productId: string, code: string) => { ok: boolean; discountPercent: number; error?: string };
  buy: (productId: string, code?: string) => { ok: boolean; error?: string; record?: PurchaseRecord };
  submitTopUp: (req: Omit<TopUpRequest, "id" | "status" | "createdAt" | "username">) => { ok: boolean; error?: string };
  approveTopUp: (id: string) => void;
  rejectTopUp: (id: string, note?: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(() => initial());

  // hydrate after mount (avoid SSR mismatch)
  useEffect(() => {
    setData(load());
  }, []);

  // persist
  useEffect(() => {
    save(data);
  }, [data]);

  // apply theme to CSS vars
  useEffect(() => {
    const root = document.documentElement;
    const t = data.settings.theme;
    root.style.setProperty("--background", t.background);
    root.style.setProperty("--surface", t.surface);
    root.style.setProperty("--card", t.card);
    root.style.setProperty("--popover", t.card);
    root.style.setProperty("--primary", `oklch(0.72 ${t.primaryChroma} ${t.primaryHue})`);
    root.style.setProperty("--glow", `oklch(0.78 ${Math.min(t.primaryChroma + 0.02, 0.3)} ${t.primaryHue - 5})`);
    root.style.setProperty("--accent", `oklch(0.6 ${t.primaryChroma + 0.02} ${t.primaryHue})`);
    root.style.setProperty("--ring", `oklch(0.72 ${t.primaryChroma} ${t.primaryHue})`);
  }, [data.settings.theme]);

  const update = useCallback((fn: (d: StoreData) => StoreData) => {
    setData((d) => fn(d));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    // admin login
    if (username === "BASX" && password === "Saree2508") {
      setData((d) => ({ ...d, currentUser: "BASX", isAdmin: true }));
      return { ok: true };
    }
    const u = data.users.find((x) => x.username === username);
    if (!u) return { ok: false, error: "ล็อกอินไม่สำเร็จ กรุณาสมัครสมาชิกก่อน" };
    const h = await sha256(password);
    if (h !== u.passwordHash) return { ok: false, error: "รหัสผ่านไม่ถูกต้อง" };
    setData((d) => ({ ...d, currentUser: username, isAdmin: false }));
    return { ok: true };
  }, [data.users]);

  const register = useCallback(
    async (username: string, password: string, confirm: string) => {
      if (!username || username.length < 3) return { ok: false, error: "ชื่อผู้ใช้สั้นเกินไป" };
      if (username === "BASX") return { ok: false, error: "ชื่อนี้สงวนไว้" };
      if (password.length < 4) return { ok: false, error: "รหัสผ่านสั้นเกินไป" };
      if (password !== confirm) return { ok: false, error: "รหัสผ่านไม่ตรงกัน" };
      if (data.users.some((u) => u.username === username))
        return { ok: false, error: "มีผู้ใช้นี้แล้ว" };
      const h = await sha256(password);
      const newUser: User = {
        username,
        passwordHash: h,
        wallet: 0,
        totalTopUp: 0,
        points: 0,
        createdAt: Date.now(),
      };
      setData((d) => ({ ...d, users: [...d.users, newUser], currentUser: username, isAdmin: false }));
      return { ok: true };
    },
    [data.users],
  );

  const logout = useCallback(() => {
    setData((d) => ({ ...d, currentUser: null, isAdmin: false }));
  }, []);

  const applyPromo = useCallback(
    (productId: string, code: string) => {
      const p = data.products.find((x) => x.id === productId);
      if (!p || !p.promoCodeId) return { ok: false, discountPercent: 0, error: "สินค้านี้ไม่รองรับโค้ด" };
      const promo = data.promoCodes.find((c) => c.id === p.promoCodeId);
      if (!promo) return { ok: false, discountPercent: 0, error: "โค้ดไม่ถูกต้อง" };
      if (promo.code.toLowerCase() !== code.trim().toLowerCase())
        return { ok: false, discountPercent: 0, error: "โค้ดไม่ถูกต้อง" };
      return { ok: true, discountPercent: promo.discountPercent };
    },
    [data.products, data.promoCodes],
  );

  const buy = useCallback(
    (productId: string, code?: string) => {
      if (!data.currentUser || data.isAdmin) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
      const product = data.products.find((p) => p.id === productId);
      if (!product) return { ok: false, error: "ไม่พบสินค้า" };
      if (product.stock.length === 0) return { ok: false, error: "สินค้าหมด" };
      let basePrice = product.salePrice ?? product.price;
      if (code && product.promoCodeId) {
        const promo = data.promoCodes.find((c) => c.id === product.promoCodeId);
        if (promo && promo.code.toLowerCase() === code.trim().toLowerCase()) {
          basePrice = Math.round(basePrice * (1 - promo.discountPercent / 100));
        }
      }
      const user = data.users.find((u) => u.username === data.currentUser);
      if (!user) return { ok: false, error: "ผู้ใช้ไม่ถูกต้อง" };
      if (user.wallet < basePrice) return { ok: false, error: "ยอดเงินใน Wallet ไม่พอ กรุณาเติมเงิน" };

      const delivered = product.stock[0];
      const record: PurchaseRecord = {
        id: uid(),
        username: user.username,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: basePrice,
        delivered,
        deliveryType: product.deliveryType,
        createdAt: Date.now(),
      };

      setData((d) => ({
        ...d,
        users: d.users.map((u) =>
          u.username === user.username
            ? { ...u, wallet: u.wallet - basePrice, points: u.points + Math.floor(basePrice / 10) }
            : u,
        ),
        products: d.products.map((p) =>
          p.id === product.id ? { ...p, stock: p.stock.slice(1) } : p,
        ),
        purchases: [record, ...d.purchases],
      }));
      return { ok: true, record };
    },
    [data.currentUser, data.isAdmin, data.products, data.promoCodes, data.users],
  );

  const submitTopUp = useCallback(
    (req: Omit<TopUpRequest, "id" | "status" | "createdAt" | "username">) => {
      if (!data.currentUser || data.isAdmin) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
      if (req.method === "bank" && !req.slipImage) return { ok: false, error: "กรุณาอัปโหลดสลิป" };
      if (req.method === "truewallet" && !req.giftLink) return { ok: false, error: "กรุณาใส่ลิงก์ซองวอเลท" };
      const newReq: TopUpRequest = {
        id: uid(),
        username: data.currentUser,
        status: "pending",
        createdAt: Date.now(),
        ...req,
      };
      setData((d) => ({ ...d, topUps: [newReq, ...d.topUps] }));
      return { ok: true };
    },
    [data.currentUser, data.isAdmin],
  );

  const approveTopUp = useCallback((id: string) => {
    setData((d) => {
      const req = d.topUps.find((t) => t.id === id);
      if (!req || req.status !== "pending") return d;
      return {
        ...d,
        topUps: d.topUps.map((t) => (t.id === id ? { ...t, status: "approved" } : t)),
        users: d.users.map((u) =>
          u.username === req.username
            ? { ...u, wallet: u.wallet + req.amount, totalTopUp: u.totalTopUp + req.amount }
            : u,
        ),
      };
    });
  }, []);

  const rejectTopUp = useCallback((id: string, note?: string) => {
    setData((d) => ({
      ...d,
      topUps: d.topUps.map((t) => (t.id === id ? { ...t, status: "rejected", note } : t)),
    }));
  }, []);

  const value: StoreCtx = {
    ...data,
    update,
    login,
    register,
    logout,
    applyPromo,
    buy,
    submitTopUp,
    approveTopUp,
    rejectTopUp,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export function useCurrentUser() {
  const s = useStore();
  if (!s.currentUser || s.isAdmin) return null;
  return s.users.find((u) => u.username === s.currentUser) || null;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
