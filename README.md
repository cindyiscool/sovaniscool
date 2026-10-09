# Sovan - Mental Health Companion Platform

A responsive, multi-tenant web application designed for quiet reflection, gentle listening, and emotional sanctuary.

---

## 🎨 Strict Design System

- **Main Background**: `#FFF5F5`
- **Sidebar & Cards**: `#FFFFFF`
- **Primary / User Chat Bubble**: `#E2B4BD`
- **Bot Chat Bubble**: `#F7D6D0`
- **Text Color**: `#4A4A4A`

---

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (zero heavy frameworks, instant loading, fully responsive).
- **Backend & Auth**: Firebase Auth (User registration, login, email verification) and Cloud Firestore (Multi-tenant data isolation).
- **AI Engine**: Google Gemini API (`gemini-3.5-flash`), with system instructions enforcing active listening, Socratic questioning, and short empathetic 1–3 sentence responses.

---

## ✨ Features

1. **"Second Brain" (Profile section)**:
   - A private text area where users write their personal background, traumas, triggers, and sensitive boundaries.
   - Saved to Firestore and dynamically injected into Tiểu Vân's system prompt so the user never has to repeat painful history.
2. **The Chat (Main Messenger View)**:
   - Real-time messenger interface with companion **Tiểu Vân**.
   - Enforces active listening, thoughtful Socratic questions, zero unsolicited advice, and concise friendly responses.
3. **The Void (Anonymous Wall)**:
   - A public feed where users post vents anonymously.
   - No usernames are displayed. No comments allowed.
   - Only interaction is the **"Send a hug"** button (heart counter).
4. **Mood Tracker**:
   - Daily check-in selecting present mindset (🌸 Joyful, 🌿 Peaceful, ✨ Hopeful, ☕ Tired, ☁️ Anxious, 🌧️ Sad, ⚡ Overwhelmed).
   - Dynamically adapts the conversational tone of Tiểu Vân's AI prompt for the day.
5. **Time Capsule**:
   - Compose letters to future self (1 month, 3 months, 6 months, 1 year).
   - Saved to Firestore tagged with user ID and intended delivery date.
   - Locked countdown with delivery notification and opening reader.
6. **Multi-tenant User Authentication**:
   - Firebase Auth with sign-up, sign-in, email verification, and redirection to private user spaces.

---

## 🚀 How to Run & Deploy to the Web

### Option 1: Local Development
```bash
# Using Node / npx
npx serve . -l 3000

# Or using Python
python3 -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in any web browser.

### Option 2: Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 3: Deploy to Vercel / Netlify
- **Vercel**: Run `npx vercel` in this folder.
- **Netlify**: Run `npx netlify deploy --prod --dir=.`.
- **GitHub Pages**: Push this repository and select the root directory under GitHub Pages settings.
