# SlideJam — Istemaal Guide (Roman Urdu)

> Factory rule: har published project mein yeh file `GUIDE-roman-urdu.md` ke naam se zaroori hai.

## 1. Yeh project kya hai?

SlideJam ek **offline slide-to-exit** puzzle game hai. Board par pehle se jam jars (blocks) lage hote hain — unhein swipe karke matching color ke exit pads par slide karo. Jab jar poora exit cover kare, clear ho jata hai. Saari jars clear = win.

**Note:** Yeh GlowGrid nahi hai (wahan tray se pieces place karke row/column clear hota hai). Yahan sirf **slide** hota hai.

## 2. Kahan se download karein?

- GitHub: `https://github.com/OfferPk/slidejam` (publish ke baad)
- ZIP / Release: GitHub Releases se `v0.1.0` (jab ship ho)
- Live Pages (baad mein): `https://offerpk.github.io/slidejam/`

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

Koi login nahi — poora game local / offline hai. Account zaroori nahi.

## 6. Features — har ek kya karta hai

### Play / Level select
- **Kahan:** Home → Play ya Levels
- **Kaise:** Level number dabao (unlocked). Pehla level hamesha khula.
- **Result:** Board load hota hai jars + exits + walls ke saath.

### Slide controls
- **Kahan:** Play screen canvas
- **Kaise:** Jar par drag/swipe — sirf uski axis (↔ ya ↕)
- **Result:** Jar wall / doosri jar tak slide; matching exit pe poora cover = clear

### Undo
- **Kahan:** Play tools → Undo
- **Kaise:** Last move wapas
- **Result:** Board pehle wale state par

### Hint
- **Kahan:** Play → Hint
- **Kaise:** Pehli hint free; baad mein rewarded ad stub (Confirm → earn)
- **Result:** Ek jar highlight hota hai aur suggested direction (misal: “right”) toast mein aati hai

### Restart
- **Kahan:** Play → Restart
- **Kaise:** Dabao — interstitial ad stub aa sakta hai
- **Result:** Level dubara start

### Mute / Remove ads
- **Kahan:** Home settings
- **Kaise:** Mute toggle; Remove ads → IAP stub (`adsRemoved` localStorage)
- **Result:** Mute flag save; ads skip jab removed

### Progress
- **Kahan:** automatic
- **Kaise:** Level jeeto → agla unlock
- **Result:** `localStorage` key `slidejam_v1`

## 7. Common masail (troubleshooting)

- **Board blank / path galat:** Vite `base: '/slidejam/'` — Pages par isi path se serve karo
- **Touch kaam nahi:** Browser zoom / overlay check; canvas pe seedha drag karo
- **Level lock:** Pehle wale levels jeeto; ya progress clear karke level 1 se
- **PWA update nahi:** Hard refresh / SW update; `npm run build` ke baad naya deploy

## 8. Security / privacy tips

- Koi account / password nahi
- Progress sirf device `localStorage` mein
- Real AdMob / billing keys MVP mein nahi — sirf stubs
- Public Wi-Fi par bhi theek; sensitive data collect nahi hota

## 9. Agla update

- Zyada levels / difficulty tuning
- Real ads SDK (jab publish gate clear ho)
- Sound pack (mute pehle se wired)
