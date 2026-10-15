-- Update 23: Courier directory (manageable in DB; page reads static list for now).
create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  scope text not null check (scope in ('india','intl','china')),
  rate_500g text not null default '',
  delivery_time text not null default '',
  coverage text not null default '',
  best_for text not null default '',
  tracking_url text not null default '',
  active boolean not null default true
);
alter table public.couriers enable row level security;
drop policy if exists "couriers public read" on public.couriers;
create policy "couriers public read" on public.couriers for select using (active = true);

insert into public.couriers (name, scope, rate_500g, delivery_time, coverage, best_for, tracking_url) values
('Delhivery','india','₹40–75','2–4 din','29,000+ pincodes','Sabse zyada reach','https://www.delhivery.com/track'),
('BlueDart','india','₹65–150','1–2 din','Pan-India metros','Fastest premium','https://www.bluedart.com/tracking'),
('DTDC','india','₹60–130','2–3 din','Pan-India','Bharosemand network','https://www.dtdc.in/trace.asp'),
('Ecom Express','india','₹45–100','3–5 din','Pan-India','Budget e-commerce','https://ecomexpress.in/tracking'),
('XpressBees','india','₹40–65','2–4 din','Pan-India','Sasta + tez','https://www.xpressbees.com/track'),
('Ekart','india','₹34–59','2–4 din','Pan-India','Sabse saste mein se ek','https://www.ekartlogistics.com/track'),
('Shadowfax','india','₹25–60','Same-day–2 din','500+ cities','Hyperlocal','https://shadowfax.in/track'),
('India Post (Speed Post)','india','₹40–75','3–6 din','Har gaon tak','Remote areas','https://www.indiapost.gov.in'),
('Gati','india','₹60–120','3–7 din','Pan-India surface','Bhaari samaan','https://www.gati.com'),
('Shiprocket (Aggregator)','india','₹21 se shuru','courier par nirbhar','27+ courier ek dashboard','Compare karke sasta chuno','https://www.shiprocket.in'),
('DHL Express','intl','₹1,500–2,500','2–4 din','220+ desh','Sabse tez international','https://www.dhl.com/in-en/home/tracking.html'),
('FedEx','intl','₹1,200–2,000','2–5 din','220+ desh','Reliable worldwide','https://www.fedex.com/en-in/home.html'),
('UPS','intl','₹1,200–2,200','2–5 din','220+ desh','B2B + heavy parcels','https://www.ups.com/track'),
('Aramex','intl','₹900–1,500','3–6 din','Middle East + worldwide','Budget international','https://www.aramex.com/track'),
('SF Express','china','~₹3,100 (0.5kg)','3–5 din','China → India','Fast official','https://www.sf-international.com'),
('Cainiao','china','~₹500–900/kg','8–15 din','China → worldwide','Alibaba network','https://global.cainiao.com'),
('Yanwen','china','~₹400–800/kg','10–18 din','China → India','Budget','https://www.yanwenexpress.com'),
('4PX','china','~₹450–850/kg','8–15 din','China → worldwide','Cross-border specialist','https://www.4px.com'),
('China Post','china','~₹600–1,000/kg','12–20 din','Worldwide','Sabse sasta','https://www.chinapost.com.cn'),
('DDP Agent (door-to-door)','china','~₹750–1,300/kg','7–12 din','China → India','Customs included','')
on conflict (name) do update set rate_500g = excluded.rate_500g, delivery_time = excluded.delivery_time;
