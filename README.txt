SastaBazaar Chatbot v2 ("Sasta Sahayak AI") — FILE MAP
==================================================
GitHub web upload: repo kholo → sahi folder me jao →
"Add file" → "Upload files" → "Choose your files" →
file select karo → "Commit changes".

Har file ko uske EXACT path par dalo:

1. components/sasta-chatbot/SastaChatbot.tsx
   → repo path: components/sasta-chatbot/SastaChatbot.tsx
   → ACTION: REPLACE (purani v1 file ki jagah overwrite karo)
   → v2 widget: 10 bhashayein, voice in+out (mic+speaker),
     photo upload (style advice), My Size Profile (browser me
     save), navigation buttons ("kholkar dekho"), AI answers,
     logged-in greeting.

2. components/sasta-chatbot/sahayak-kb.ts
   → repo path: components/sasta-chatbot/sahayak-kb.ts
   → ACTION: NEW FILE (upload karo)
   → Shared knowledge base (sabhi pages) + nav intents
     (voice/text → page) + size-profile helpers. Client widget
     aur server route dono isi ko use karte hain — iske bina
     widget NAHI chalega.

3. app/api/sahayak/route.ts
   → repo path: app/api/sahayak/route.ts
   → ACTION: NEW FILE (pehle app/api/sahayak/ folder banao,
     phir usme upload karo)
   → Server route: Gemini/OpenAI-compatible AI call, REAL
     Supabase catalog lookup (sirf wahi jawab jo catalog me
     hai; nahi hai to "seller ne jaankari nahi di" bolega),
     photo vision (photo kabhi save/share nahi hoti).
     API key sirf server par rehti hai (Vercel env vars) —
     browser ko kabhi nahi jaati.

4. CHATBOT_V2_SETUP_HINDI.txt
   → Ye repo me dalne ki ZAROORAT NAHI — sirf tumhare liye
     Hindi click-by-click setup guide hai. Laptop me rakho.

INSTALL NOTE (app/layout.tsx me):
  import { SastaChatbot } from '@/components/sasta-chatbot/SastaChatbot';
  Aur </AuthProvider> ke andar (uske band hone se pehle):
  <SastaChatbot />

Vercel env vars (Settings → Environment Variables):
  AI_PROVIDER = gemini
  AI_API_KEY  = <tumhari free Gemini key, aistudio.google.com se>
Phir Deployments → Redeploy karo.

Supabase me KUCH NAHI dalna — koi SQL nahi chalani.
