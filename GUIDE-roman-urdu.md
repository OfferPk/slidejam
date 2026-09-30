# SlideJam — Istemaal Guide (Roman Urdu)

> Factory rule: har published project mein yeh file `GUIDE-roman-urdu.md` ke naam se zaroori hai.

## 1. Yeh project kya hai?

SlideJam ek **traffic-jam slide puzzle** hai. Abhi baarah mukammal **6×6 traffic levels (1–12)** khelne ke liye khule hain: laal target car ko uski lane mein slide karo, traffic ko move karo, phir target car ko right-side **EXIT** se bahar nikalo. Har gaari apni lane tak mehdood rehti hai.

Repo mein purane jar-puzzle records mojood hain; converted IDs 5–12 ke asal records `src/levels/legacy/` mein archive hain, aur unconverted Levels 13–50 menu mein **playable nahi** hain. Kisi board ko traffic rules, geometry, aur solvability checks ke baad hi menu mein rakha jata hai, is liye player ko unrevised jar board par nahi bheja jayega.

Traffic level mein gaariyan apni lane tak mehdood hain: horizontal gaari left/right, vertical gaari up/down slide karti hai. Gaari doosri traffic ke andar se nahi guzar sakti. Target car exit se nikal jaye to level jeet jate ho; baqi gaariyan board par reh sakti hain.

## 2. Kahan se download karein?

- GitHub: `https://github.com/OfferPk/slidejam`
- Live Pages: `https://offerpk.github.io/slidejam/`

## 3. Pehle kya chahiye? (requirements)

- **Node.js** 20+ (dev / build ke liye)
- Modern browser (Chrome / Edge / Firefox / Safari) — touch ya mouse
- Internet sirf pehli load / install ke liye; phir PWA offline chal sakti hai

## 4. Install + Run (step-by-step)

1. Repo clone ya ZIP extract karo
2. Folder mein jao: `cd slidejam`
3. Dependencies: `npm install`
4. Dev server: `npm run dev` — browser URL kholo
5. Production build: `npm run build` — output `dist/` mein; base path `/slidejam/`

## 5. Demo login (agar ho)

Koi login nahi — game local / offline hai. Account zaroori nahi.

## 6. Controls

### Play

- **Kahan:** Home → Play ya Levels
- **Kaise:** Gaari par tap/click karo; phir uski lane mein drag/swipe. Keyboard par board focus ho to **Enter** se gaari select karo, phir usi axis ka arrow dabao.
- **Maqsad:** Red target car ka rasta clear karo aur use right-side EXIT se bahar slide karo. Bus/truck bhi sirf apni lane mein chalte hain.

### Undo

- **Kahan:** Play tools → Undo
- **Kaise:** Last move wapas. **Ctrl/⌘+Z** bhi kaam karta hai.
- **Natija:** Board pehle wali state par; target EXIT se nikalne ke baad win ko undo nahi kiya ja sakta.

### Hint, Restart, aur settings

- **Hint:** Pehli hint free; baad mein rewarded-ad stub. Gaari highlight hoti hai aur direction toast mein aati hai.
- **Restart:** Level dubara start; interstitial ad stub aa sakta hai.
- **Mute:** Home settings se toggle.
- **Progress:** `localStorage` key `slidejam_v1` mein save hota hai.

## 7. Common masail (troubleshooting)

- **Board blank / path galat:** Vite `base: '/slidejam/'` — Pages par isi path se serve karo.
- **Touch kaam nahi:** Browser zoom / overlay check; canvas pe seedha lane ki direction mein drag karo.
- **Koi aur level nazar nahi aata:** Levels 1–12 verified traffic puzzles hain; unconverted jar layouts (13–50) jaan bujh kar hidden hain jab tak woh convert aur verify na hon.
- **PWA update nahi:** Hard refresh / service-worker update; `npm run build` ke baad naya deploy.

## 8. Security / privacy tips

- Koi account / password nahi
- Progress sirf device `localStorage` mein
- Real ad SDK ya billing keys nahi — sirf stubs
- Sensitive data collect nahi hota
