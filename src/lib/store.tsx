import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
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
  category: string;
  platforms: Platform[];
  image: string;
  price: number;
  salePrice?: number | null;
  description: string;
  deliveryType: DeliveryType;
  stock: DeliveryItem[];
  promoCodeId?: string | null;
  hot?: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  wallet: number;
  totalTopUp: number;
  points: number;
}

export interface PurchaseRecord {
  id: string;
  user_id: string;
  username?: string;
  productId: string | null;
  productName: string;
  productImage: string;
  price: number;
  delivered: DeliveryItem;
  deliveryType: DeliveryType;
  createdAt: number;
}

export interface TopUpRequest {
  id: string;
  user_id: string;
  username?: string;
  method: "bank" | "truewallet";
  amount: number;
  slipImage?: string | null;
  giftLink?: string | null;
  status: "pending" | "approved" | "rejected";
  note?: string | null;
  autoVerified?: boolean;
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
  count: number;
  speed: number;
  size: number;
}

export interface ThemeSettings {
  primaryHue: number;
  primaryChroma: number;
  background: string;
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

const defaultSettings: SiteSettings = {
  shopName: "BasX SHOP",
  logo: logoUrl,
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
  banks: [],
};

// ---------- helpers ----------
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@basx.shop`;

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// row mappers
const mapProduct = (r: any): Product => ({
  id: r.id,
  name: r.name,
  category: r.category || "",
  platforms: (r.platforms || []) as Platform[],
  image: r.image || "",
  price: Number(r.price) || 0,
  salePrice: r.sale_price === null ? null : Number(r.sale_price),
  description: r.description || "",
  deliveryType: (r.delivery_type || "key") as DeliveryType,
  stock: Array.isArray(r.stock) ? r.stock : [],
  promoCodeId: r.promo_code_id || null,
  hot: !!r.hot,
});

const mapSettings = (r: any, banks: BankAccount[], banners: Banner[]): SiteSettings => ({
  shopName: r.shop_name || "BasX SHOP",
  logo: r.logo || logoUrl,
  discordUrl: r.discord_url || "",
  announcement: { ...defaultSettings.announcement, ...(r.announcement || {}) },
  theme: { ...defaultSettings.theme, ...(r.theme || {}) },
  particles: { ...defaultSettings.particles, ...(r.particles || {}) },
  truewalletBotEnabled: !!r.truewallet_bot_enabled,
  truewalletPhone: r.truewallet_phone || "",
  bankBotEnabled: !!r.bank_bot_enabled,
  banks,
  banners,
});

const mapTopUp = (r: any, usernameMap?: Map<string, string>): TopUpRequest => ({
  id: r.id,
  user_id: r.user_id,
  username: usernameMap?.get(r.user_id),
  method: r.method,
  amount: Number(r.amount),
  slipImage: r.slip_image,
  giftLink: r.gift_link,
  status: r.status,
  note: r.note,
  autoVerified: r.auto_verified,
  createdAt: new Date(r.created_at).getTime(),
});

const mapPurchase = (r: any, usernameMap?: Map<string, string>): PurchaseRecord => ({
  id: r.id,
  user_id: r.user_id,
  username: usernameMap?.get(r.user_id),
  productId: r.product_id,
  productName: r.product_name,
  productImage: r.product_image || "",
  price: Number(r.price),
  delivered: r.delivered || {},
  deliveryType: r.delivery_type,
  createdAt: new Date(r.created_at).getTime(),
});

// ---------- Context ----------
interface StoreCtx {
  settings: SiteSettings;
  products: Product[];
  promoCodes: PromoCode[];
  banks: BankAccount[];
  profiles: Profile[]; // visible only to admin
  purchases: PurchaseRecord[];
  topUps: TopUpRequest[];
  currentUser: string | null; // username
  isAdmin: boolean;
  myProfile: Profile | null;
  ready: boolean;

  login: (u: string, p: string) => Promise<{ ok: boolean; error?: string }>;
  register: (u: string, p: string, c: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPw: string) => Promise<{ ok: boolean; error?: string }>;

  // mutators (admin)
  saveProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  savePromo: (c: PromoCode) => Promise<void>;
  deletePromo: (id: string) => Promise<void>;
  saveBank: (b: BankAccount) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  addBanner: (image: string) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<SiteSettings>) => Promise<void>;
  adjustWallet: (userId: string, delta: number) => Promise<void>;

  // purchase / topup
  applyPromo: (productId: string, code: string) => { ok: boolean; discountPercent: number; error?: string };
  buy: (productId: string, code?: string) => Promise<{ ok: boolean; error?: string }>;
  submitTopUp: (req: { method: "bank" | "truewallet"; amount: number; slipImage?: string; giftLink?: string }) => Promise<{ ok: boolean; error?: string; autoVerified?: boolean }>;
  approveTopUp: (id: string) => Promise<void>;
  rejectTopUp: (id: string, note?: string) => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [topUps, setTopUps] = useState<TopUpRequest[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // ---------- Initial fetch ----------
  const fetchPublic = useCallback(async () => {
    const [pRes, prRes, bkRes, bnRes, stRes] = await Promise.all([
      supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("promo_codes").select("*"),
      supabase.from("banks").select("*").order("created_at"),
      supabase.from("banners").select("*").order("sort_order"),
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (pRes.data) setProducts(pRes.data.map(mapProduct));
    if (prRes.data) setPromoCodes(prRes.data.map((r) => ({ id: r.id, code: r.code, discountPercent: r.discount_percent })));
    const banksList: BankAccount[] = (bkRes.data || []).map((r) => ({
      id: r.id,
      bankName: r.bank_name,
      accountName: r.account_name,
      accountNumber: r.account_number,
    }));
    setBanks(banksList);
    const bannersList: Banner[] = (bnRes.data || []).map((r) => ({
      id: r.id,
      image: r.image,
      title: r.title || undefined,
    }));
    setBanners(bannersList);
    if (stRes.data) setSettings(mapSettings(stRes.data, banksList, bannersList));
  }, []);

  // refresh banks/banners into settings when those change
  useEffect(() => {
    setSettings((s) => ({ ...s, banks, banners }));
  }, [banks, banners]);

  // ---------- Auth ----------
  const refreshSession = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      userIdRef.current = null;
      setCurrentUser(null);
      setIsAdmin(false);
      setMyProfile(null);
      setProfiles([]);
      setPurchases([]);
      setTopUps([]);
      return;
    }
    userIdRef.current = user.id;
    // load profile + role
    const [profRes, roleRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const adminRow = (roleRes.data || []).some((r: any) => r.role === "admin");
    setIsAdmin(adminRow);
    if (profRes.data) {
      const prof: Profile = {
        id: profRes.data.id,
        user_id: profRes.data.user_id,
        username: profRes.data.username,
        wallet: Number(profRes.data.wallet),
        totalTopUp: Number(profRes.data.total_topup),
        points: profRes.data.points,
      };
      setMyProfile(prof);
      setCurrentUser(prof.username);
    }
    // load my purchases + topups
    const meId = user.id;
    if (adminRow) {
      const [allP, allT, allProf] = await Promise.all([
        supabase.from("purchases").select("*").order("created_at", { ascending: false }),
        supabase.from("topup_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
      ]);
      const profs: Profile[] = (allProf.data || []).map((r) => ({
        id: r.id, user_id: r.user_id, username: r.username,
        wallet: Number(r.wallet), totalTopUp: Number(r.total_topup), points: r.points,
      }));
      setProfiles(profs);
      const map = new Map(profs.map((p) => [p.user_id, p.username] as const));
      setPurchases((allP.data || []).map((r) => mapPurchase(r, map)));
      setTopUps((allT.data || []).map((r) => mapTopUp(r, map)));
    } else {
      const [myP, myT] = await Promise.all([
        supabase.from("purchases").select("*").eq("user_id", meId).order("created_at", { ascending: false }),
        supabase.from("topup_requests").select("*").eq("user_id", meId).order("created_at", { ascending: false }),
      ]);
      setPurchases((myP.data || []).map((r) => mapPurchase(r)));
      setTopUps((myT.data || []).map((r) => mapTopUp(r)));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPublic().finally(() => mounted && setReady(true));
    refreshSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // defer to avoid recursive lock
      setTimeout(() => refreshSession(), 0);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [fetchPublic, refreshSession]);

  // ---------- Realtime ----------
  useEffect(() => {
    const ch = supabase.channel("shop-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false })
          .then(({ data }) => data && setProducts(data.map(mapProduct)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => {
        supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
          .then(({ data }) => data && setSettings((s) => mapSettings(data, s.banks, s.banners)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "banks" }, () => {
        supabase.from("banks").select("*").order("created_at").then(({ data }) =>
          data && setBanks(data.map((r) => ({ id: r.id, bankName: r.bank_name, accountName: r.account_name, accountNumber: r.account_number }))));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        supabase.from("banners").select("*").order("sort_order").then(({ data }) =>
          data && setBanners(data.map((r) => ({ id: r.id, image: r.image, title: r.title || undefined }))));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "promo_codes" }, () => {
        supabase.from("promo_codes").select("*").then(({ data }) =>
          data && setPromoCodes(data.map((r) => ({ id: r.id, code: r.code, discountPercent: r.discount_percent }))));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        if (userIdRef.current) refreshSession();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "topup_requests" }, () => {
        if (userIdRef.current) refreshSession();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, () => {
        if (userIdRef.current) refreshSession();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshSession]);

  // ---------- Theme application ----------
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const t = settings.theme;
    root.style.setProperty("--background", t.background);
    root.style.setProperty("--surface", t.surface);
    root.style.setProperty("--card", t.card);
    root.style.setProperty("--popover", t.card);
    root.style.setProperty("--primary", `oklch(0.72 ${t.primaryChroma} ${t.primaryHue})`);
    root.style.setProperty("--glow", `oklch(0.78 ${Math.min(t.primaryChroma + 0.02, 0.3)} ${t.primaryHue - 5})`);
    root.style.setProperty("--accent", `oklch(0.6 ${t.primaryChroma + 0.02} ${t.primaryHue})`);
    root.style.setProperty("--ring", `oklch(0.72 ${t.primaryChroma} ${t.primaryHue})`);
  }, [settings.theme]);

  // ---------- Auth actions ----------
  const login = useCallback(async (u: string, p: string) => {
    const email = usernameToEmail(u);
    const { error } = await supabase.auth.signInWithPassword({ email, password: p });
    if (error) {
      const msg = error.message || "";
      if (/invalid/i.test(msg)) return { ok: false, error: "ล็อกอินไม่สำเร็จ กรุณาสมัครก่อนหรือเช็ครหัสผ่าน" };
      return { ok: false, error: msg };
    }
    return { ok: true };
  }, []);

  const register = useCallback(async (u: string, p: string, c: string) => {
    if (!u || u.trim().length < 3) return { ok: false, error: "ชื่อผู้ใช้สั้นเกินไป" };
    if (p.length < 6) return { ok: false, error: "รหัสผ่านต้องอย่างน้อย 6 ตัว" };
    if (p !== c) return { ok: false, error: "รหัสผ่านไม่ตรงกัน" };
    const email = usernameToEmail(u);
    const { error } = await supabase.auth.signUp({
      email,
      password: p,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username: u.trim() },
      },
    });
    if (error) {
      if (/already/i.test(error.message)) return { ok: false, error: "มีผู้ใช้นี้แล้ว" };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const changePassword = useCallback(async (newPw: string) => {
    if (newPw.length < 6) return { ok: false, error: "รหัสใหม่ต้องอย่างน้อย 6 ตัว" };
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  // ---------- Mutations ----------
  const saveProduct = useCallback(async (p: Product) => {
    const row = {
      name: p.name,
      category: p.category,
      platforms: p.platforms,
      image: p.image,
      price: p.price,
      sale_price: p.salePrice ?? null,
      description: p.description,
      delivery_type: p.deliveryType,
      stock: p.stock as any,
      promo_code_id: p.promoCodeId || null,
      hot: !!p.hot,
    };
    const existing = products.find((x) => x.id === p.id);
    if (existing) {
      await supabase.from("products").update(row).eq("id", p.id);
    } else {
      await supabase.from("products").insert(row);
    }
  }, [products]);

  const deleteProduct = useCallback(async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
  }, []);

  const savePromo = useCallback(async (c: PromoCode) => {
    const exists = promoCodes.find((x) => x.id === c.id);
    if (exists) {
      await supabase.from("promo_codes").update({ code: c.code, discount_percent: c.discountPercent }).eq("id", c.id);
    } else {
      await supabase.from("promo_codes").insert({ code: c.code, discount_percent: c.discountPercent });
    }
  }, [promoCodes]);

  const deletePromo = useCallback(async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
  }, []);

  const saveBank = useCallback(async (b: BankAccount) => {
    const exists = banks.find((x) => x.id === b.id);
    if (exists) {
      await supabase.from("banks").update({ bank_name: b.bankName, account_name: b.accountName, account_number: b.accountNumber }).eq("id", b.id);
    } else {
      await supabase.from("banks").insert({ bank_name: b.bankName, account_name: b.accountName, account_number: b.accountNumber });
    }
  }, [banks]);

  const deleteBank = useCallback(async (id: string) => {
    await supabase.from("banks").delete().eq("id", id);
  }, []);

  const addBanner = useCallback(async (image: string) => {
    await supabase.from("banners").insert({ image, sort_order: 0 });
  }, []);

  const deleteBanner = useCallback(async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
  }, []);

  const updateSettings = useCallback(async (patch: Partial<SiteSettings>) => {
    const row: any = {};
    if (patch.shopName !== undefined) row.shop_name = patch.shopName;
    if (patch.logo !== undefined) row.logo = patch.logo;
    if (patch.discordUrl !== undefined) row.discord_url = patch.discordUrl;
    if (patch.announcement !== undefined) row.announcement = patch.announcement;
    if (patch.theme !== undefined) row.theme = patch.theme;
    if (patch.particles !== undefined) row.particles = patch.particles;
    if (patch.truewalletBotEnabled !== undefined) row.truewallet_bot_enabled = patch.truewalletBotEnabled;
    if (patch.truewalletPhone !== undefined) row.truewallet_phone = patch.truewalletPhone;
    if (patch.bankBotEnabled !== undefined) row.bank_bot_enabled = patch.bankBotEnabled;
    await supabase.from("site_settings").update(row).eq("id", 1);
  }, []);

  const adjustWallet = useCallback(async (userId: string, delta: number) => {
    const p = profiles.find((x) => x.user_id === userId);
    if (!p) return;
    await supabase.from("profiles").update({ wallet: Math.max(0, p.wallet + delta) }).eq("user_id", userId);
  }, [profiles]);

  // ---------- Promo / Buy ----------
  const applyPromo = useCallback((productId: string, code: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.promoCodeId) return { ok: false, discountPercent: 0, error: "สินค้านี้ไม่รองรับโค้ด" };
    const promo = promoCodes.find((c) => c.id === p.promoCodeId);
    if (!promo) return { ok: false, discountPercent: 0, error: "โค้ดไม่ถูกต้อง" };
    if (promo.code.toLowerCase() !== code.trim().toLowerCase())
      return { ok: false, discountPercent: 0, error: "โค้ดไม่ถูกต้อง" };
    return { ok: true, discountPercent: promo.discountPercent };
  }, [products, promoCodes]);

  const buy = useCallback(async (productId: string, code?: string) => {
    if (!userIdRef.current) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    const { data, error } = await supabase.rpc("buy_product", { _product_id: productId, _code: code || null });
    if (error) return { ok: false, error: error.message };
    const r = data as any;
    if (!r?.ok) return { ok: false, error: r?.error || "ซื้อไม่สำเร็จ" };
    await refreshSession();
    return { ok: true };
  }, [refreshSession]);

  // ---------- TopUp ----------
  const submitTopUp = useCallback(async (req: { method: "bank" | "truewallet"; amount: number; slipImage?: string; giftLink?: string }) => {
    if (!userIdRef.current) return { ok: false, error: "กรุณาเข้าสู่ระบบ" };
    if (req.method === "bank" && !req.slipImage) return { ok: false, error: "กรุณาอัปโหลดสลิป" };
    if (req.method === "truewallet" && !req.giftLink) return { ok: false, error: "กรุณาใส่ลิงก์ซองวอเลท" };
    if (req.amount <= 0) return { ok: false, error: "จำนวนเงินไม่ถูกต้อง" };

    // auto-verify path
    if (req.method === "bank" && settings.bankBotEnabled && req.slipImage) {
      const { data, error } = await supabase.functions.invoke("verify-slip", {
        body: { slipImage: req.slipImage, amount: req.amount },
      });
      if (error) return { ok: false, error: "ตรวจสลิปอัตโนมัติล้มเหลว: " + error.message };
      if ((data as any)?.ok) {
        await refreshSession();
        return { ok: true, autoVerified: true };
      } else {
        return { ok: false, error: (data as any)?.error || "สลิปไม่ผ่านการตรวจสอบ" };
      }
    }
    if (req.method === "truewallet" && settings.truewalletBotEnabled && req.giftLink) {
      const { data, error } = await supabase.functions.invoke("redeem-truewallet", {
        body: { giftLink: req.giftLink },
      });
      if (error) return { ok: false, error: "รับซองอัตโนมัติล้มเหลว: " + error.message };
      if ((data as any)?.ok) {
        await refreshSession();
        return { ok: true, autoVerified: true };
      } else {
        return { ok: false, error: (data as any)?.error || "ซองไม่ถูกต้อง" };
      }
    }

    // manual
    const { error } = await supabase.from("topup_requests").insert({
      user_id: userIdRef.current,
      method: req.method,
      amount: req.amount,
      slip_image: req.slipImage || null,
      gift_link: req.giftLink || null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, autoVerified: false };
  }, [settings.bankBotEnabled, settings.truewalletBotEnabled, refreshSession]);

  const approveTopUp = useCallback(async (id: string) => {
    await supabase.rpc("approve_topup", { _id: id });
    await refreshSession();
  }, [refreshSession]);

  const rejectTopUp = useCallback(async (id: string, note?: string) => {
    await supabase.from("topup_requests").update({ status: "rejected", note: note || null }).eq("id", id);
    await refreshSession();
  }, [refreshSession]);

  const value: StoreCtx = {
    settings, products, promoCodes, banks, profiles, purchases, topUps,
    currentUser, isAdmin, myProfile, ready,
    login, register, logout, changePassword,
    saveProduct, deleteProduct, savePromo, deletePromo,
    saveBank, deleteBank, addBanner, deleteBanner,
    updateSettings, adjustWallet,
    applyPromo, buy, submitTopUp, approveTopUp, rejectTopUp,
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
  return s.myProfile;
}
