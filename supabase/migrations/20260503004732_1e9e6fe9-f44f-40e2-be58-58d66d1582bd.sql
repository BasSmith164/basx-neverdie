-- =========================================
-- ROLES
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles select own or admin" ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles admin manage" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  wallet NUMERIC NOT NULL DEFAULT 0,
  total_topup NUMERIC NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles select own or admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles update own or admin" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + role on signup. Username read from raw_user_meta_data->>'username'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (user_id, username) VALUES (NEW.id, uname)
  ON CONFLICT (user_id) DO NOTHING;
  -- assign admin to BASX, user to others
  IF uname = 'BASX' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- PROMO CODES
-- =========================================
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_codes read all" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "promo_codes admin manage" ON public.promo_codes FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- PRODUCTS
-- =========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  image TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  sale_price NUMERIC,
  description TEXT NOT NULL DEFAULT '',
  delivery_type TEXT NOT NULL DEFAULT 'key',
  stock JSONB NOT NULL DEFAULT '[]'::jsonb,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  hot BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products read all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin manage" ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_touch BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- BANKS / BANNERS / SETTINGS
-- =========================================
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banks read all" ON public.banks FOR SELECT USING (true);
CREATE POLICY "banks admin manage" ON public.banks FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners read all" ON public.banners FOR SELECT USING (true);
CREATE POLICY "banners admin manage" ON public.banners FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shop_name TEXT NOT NULL DEFAULT 'BasX SHOP',
  logo TEXT NOT NULL DEFAULT '',
  discord_url TEXT NOT NULL DEFAULT 'https://discord.gg/6Gev7X9xVF',
  announcement JSONB NOT NULL DEFAULT '{"title":"ประกาศจากทางร้าน","body":"🛒 ซื้อสินค้าทางร้านแล้วพบปัญหา ติดต่อแอดมินผ่าน Discord","date":""}'::jsonb,
  theme JSONB NOT NULL DEFAULT '{"primaryHue":235,"primaryChroma":0.18,"background":"oklch(0.13 0.02 250)","surface":"oklch(0.17 0.03 250)","card":"oklch(0.18 0.04 250)"}'::jsonb,
  particles JSONB NOT NULL DEFAULT '{"enabled":true,"shape":"snow","count":70,"speed":1.2,"size":8}'::jsonb,
  truewallet_bot_enabled BOOLEAN NOT NULL DEFAULT false,
  truewallet_phone TEXT NOT NULL DEFAULT '',
  bank_bot_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings read all" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings admin update" ON public.site_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "site_settings admin insert" ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_settings_touch BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO public.banks (bank_name, account_name, account_number)
VALUES ('ธนาคารกรุงเทพ', 'BasX SHOP', '478-4-271134');
INSERT INTO public.promo_codes (code, discount_percent) VALUES ('WELCOME10', 10);

-- =========================================
-- TOPUP REQUESTS
-- =========================================
CREATE TABLE public.topup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('bank','truewallet')),
  amount NUMERIC NOT NULL DEFAULT 0,
  slip_image TEXT,
  gift_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  note TEXT,
  auto_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "topup select own or admin" ON public.topup_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "topup insert own" ON public.topup_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "topup admin update" ON public.topup_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_topup_touch BEFORE UPDATE ON public.topup_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- PURCHASES
-- =========================================
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL,
  delivered JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases select own or admin" ON public.purchases FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "purchases insert own" ON public.purchases FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =========================================
-- BUY RPC (atomic)
-- =========================================
CREATE OR REPLACE FUNCTION public.buy_product(_product_id UUID, _code TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _prod RECORD;
  _profile RECORD;
  _price NUMERIC;
  _promo RECORD;
  _delivered JSONB;
  _new_stock JSONB;
  _purchase_id UUID;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','กรุณาเข้าสู่ระบบ'); END IF;
  SELECT * INTO _prod FROM public.products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','ไม่พบสินค้า'); END IF;
  IF jsonb_array_length(_prod.stock) = 0 THEN RETURN jsonb_build_object('ok',false,'error','สินค้าหมด'); END IF;

  _price := COALESCE(_prod.sale_price, _prod.price);
  IF _code IS NOT NULL AND _prod.promo_code_id IS NOT NULL THEN
    SELECT * INTO _promo FROM public.promo_codes WHERE id = _prod.promo_code_id;
    IF FOUND AND lower(_promo.code) = lower(trim(_code)) THEN
      _price := round(_price * (1 - _promo.discount_percent::NUMERIC/100));
    END IF;
  END IF;

  SELECT * INTO _profile FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','ไม่พบโปรไฟล์'); END IF;
  IF _profile.wallet < _price THEN RETURN jsonb_build_object('ok',false,'error','ยอดเงินไม่พอ กรุณาเติมเงิน'); END IF;

  _delivered := _prod.stock->0;
  _new_stock := _prod.stock - 0;

  UPDATE public.products SET stock = _new_stock WHERE id = _product_id;
  UPDATE public.profiles SET wallet = wallet - _price, points = points + floor(_price/10)::int
    WHERE user_id = _uid;

  INSERT INTO public.purchases (user_id, product_id, product_name, product_image, price, delivered, delivery_type)
  VALUES (_uid, _prod.id, _prod.name, _prod.image, _price, _delivered, _prod.delivery_type)
  RETURNING id INTO _purchase_id;

  RETURN jsonb_build_object('ok',true,'purchase_id',_purchase_id,'delivered',_delivered,'price',_price);
END $$;

-- =========================================
-- APPROVE TOPUP RPC
-- =========================================
CREATE OR REPLACE FUNCTION public.approve_topup(_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _req RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RETURN jsonb_build_object('ok',false,'error','no permission'); END IF;
  SELECT * INTO _req FROM public.topup_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND OR _req.status <> 'pending' THEN RETURN jsonb_build_object('ok',false,'error','คำขอไม่ถูกต้อง'); END IF;
  UPDATE public.topup_requests SET status='approved' WHERE id=_id;
  UPDATE public.profiles SET wallet = wallet + _req.amount, total_topup = total_topup + _req.amount
    WHERE user_id = _req.user_id;
  RETURN jsonb_build_object('ok',true);
END $$;

-- =========================================
-- REALTIME
-- =========================================
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.site_settings REPLICA IDENTITY FULL;
ALTER TABLE public.banks REPLICA IDENTITY FULL;
ALTER TABLE public.banners REPLICA IDENTITY FULL;
ALTER TABLE public.promo_codes REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.topup_requests REPLICA IDENTITY FULL;
ALTER TABLE public.purchases REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.banners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.topup_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;

-- =========================================
-- STORAGE: slips + product images
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('slips', 'slips', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-assets', 'shop-assets', true) ON CONFLICT DO NOTHING;

CREATE POLICY "slips public read" ON storage.objects FOR SELECT USING (bucket_id = 'slips');
CREATE POLICY "slips auth upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'slips');

CREATE POLICY "shop-assets public read" ON storage.objects FOR SELECT USING (bucket_id = 'shop-assets');
CREATE POLICY "shop-assets admin write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'shop-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "shop-assets admin update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'shop-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "shop-assets admin delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'shop-assets' AND public.has_role(auth.uid(),'admin'));