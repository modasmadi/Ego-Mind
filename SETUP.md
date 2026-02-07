# 🚀 Million Logo Page - Setup Guide

## الملفات:
```
├── index.html      ← الموقع الرئيسي
├── admin.html      ← لوحة التحكم
└── SETUP.md        ← دليل الإعداد (أنت هنا)
```

---

## 📋 خطوة 1: إنشاء مشروع Firebase (مجاني)

### 1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)

### 2. اضغط "Create a project" أو "Add project"
   - اسم المشروع: `million-logo-page`
   - اضغط Continue
   - (اختياري) فعّل Google Analytics
   - اضغط Create Project

### 3. انتظر حتى يتم إنشاء المشروع

---

## 📋 خطوة 2: تفعيل Firestore Database

### 1. من القائمة الجانبية، اختر **Firestore Database**

### 2. اضغط **Create database**

### 3. اختر **Start in test mode** (للتجربة)
   - ⚠️ لاحقاً غيّره لـ production mode مع قواعد أمان

### 4. اختر موقع السيرفر الأقرب (مثل: `europe-west1`)

### 5. اضغط **Done**

---

## 📋 خطوة 3: تفعيل Storage (لرفع الصور)

### 1. من القائمة الجانبية، اختر **Storage**

### 2. اضغط **Get started**

### 3. اختر **Start in test mode**

### 4. اضغط **Done**

---

## 📋 خطوة 4: تفعيل Authentication (للأدمن)

### 1. من القائمة الجانبية، اختر **Authentication**

### 2. اضغط **Get started**

### 3. اختر **Email/Password** وفعّله

### 4. اذهب لتاب **Users** واضغط **Add user**
   - Email: `ezz2006m@gmail.com` (أو أي إيميل تريده)
   - Password: اختر كلمة سر قوية
   - هذا سيكون حساب الأدمن

---

## 📋 خطوة 5: الحصول على Firebase Config

### 1. اضغط على ⚙️ (Settings) بجانب Project Overview

### 2. اختر **Project settings**

### 3. مرر للأسفل إلى **Your apps**

### 4. اضغط على أيقونة **</>** (Web)

### 5. سجّل التطبيق:
   - App nickname: `million-logo-web`
   - ✅ Also set up Firebase Hosting (اختياري)
   - اضغط **Register app**

### 6. ستظهر لك الـ Config، انسخها:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy.....................",
  authDomain: "million-logo-page.firebaseapp.com",
  projectId: "million-logo-page",
  storageBucket: "million-logo-page.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 📋 خطوة 6: تحديث الكود

### 1. افتح `index.html`

### 2. ابحث عن:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    ...
};
```

### 3. استبدلها بالـ Config الحقيقي من Firebase

### 4. كرر نفس الشيء في `admin.html`

---

## 📋 خطوة 7: قواعد الأمان (مهم للإنتاج!)

### Firestore Rules:
اذهب إلى Firestore → Rules، واستبدل بـ:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders - anyone can create, only admin can read/update
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
    
    // Cells - anyone can read, only admin can write
    match /cells/{cellId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules:
اذهب إلى Storage → Rules، واستبدل بـ:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Anyone can upload to proofs and logos
    match /proofs/{allPaths=**} {
      allow read, write: if true;
    }
    match /logos/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 📋 خطوة 8: رفع الملفات على GitHub

```bash
git add .
git commit -m "Add Firebase integration"
git push
```

---

## ✅ تم! الموقع جاهز

### روابطك:
- **الموقع الرئيسي:** `https://modasmadi.github.io/million-logo-page/`
- **لوحة التحكم:** `https://modasmadi.github.io/million-logo-page/admin.html`

---

## 🔄 كيف يعمل النظام:

```
👤 المستخدم:
1. يختار خانات من الشبكة
2. يدخل بياناته (اسم، إيميل، قصة)
3. يدفع عبر CliQ أو Bank
4. يرفع صورة إثبات الدفع
5. يستلم رقم الطلب
6. ينتظر التأكيد

👨‍💼 أنت (الأدمن):
1. تدخل لوحة التحكم (admin.html)
2. ترى الطلبات الجديدة
3. تتحقق من صورة الدفع
4. تضغط "Approve" أو "Reject"
5. المستخدم يستلم إيميل (يدوي حالياً)

👤 المستخدم بعد التأكيد:
1. يدخل رقم الطلب كـ "كود تفعيل"
2. يرفع شعاره
3. الشعار يظهر على الشبكة!
```

---

## 📧 إرسال إيميل التأكيد (يدوي)

بعد approve، أرسل هذا الإيميل للعميل:

```
Subject: ✅ Your Million Logo Page Order is Approved!

مرحباً [الاسم]!

تم تأكيد طلبك بنجاح 🎉

رقم الطلب / كود التفعيل: [ORDER_ID]

لرفع شعارك:
1. اذهب إلى: https://modasmadi.github.io/million-logo-page/
2. اضغط على "I have a code" في أسفل الصفحة
3. أدخل الكود أعلاه
4. ارفع شعارك

شكراً لكونك جزءاً من التاريخ! 🚀

---
Million Logo Page
```

---

## 🆘 مشاكل شائعة:

### "Firebase not configured"
- تأكد من نسخ الـ Config الصحيح من Firebase Console

### "Permission denied"
- تأكد من تفعيل Firestore و Storage في test mode
- أو حدّث الـ Security Rules

### الصور لا ترفع
- تأكد من تفعيل Storage
- تأكد من الـ Storage Rules

---

## 📞 للمساعدة:
- WhatsApp: +962775925599
- Email: ezz2006m@gmail.com

---

**بالتوفيق يا محمود! 🇯🇴🚀**
