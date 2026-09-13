# غرفة تتبع حركة الناقلات

تطبيق CRM بسيط بدون أي حزم خارجية (Node.js فقط) — لوحة متابعة، سجل حركات ملوّن، ونموذج إضافة.
البيانات تُحفظ في ملف `data/records.json` على نفس السيرفر (لا حاجة لقاعدة بيانات منفصلة).

## التشغيل محلياً (لتجربته على جهازك)

يتطلب [Node.js](https://nodejs.org) نسخة 18 أو أحدث (لا حاجة لأي تثبيت آخر — لا `npm install`).

```
node server.js
```

ثم افتح المتصفح على: `http://localhost:3000`

---

## النشر على دومينك الخاص — 3 طرق

### الطريقة الأولى: منصة استضافة جاهزة (الأسهل — موصى بها)

مثل **Render.com** أو **Railway.app**. مجانية للبداية، ولا تحتاج خبرة سيرفرات.

1. ارفع هذا المجلد إلى حساب GitHub (أنشئ repository جديد وارفع الملفات إليه).
2. في Render.com: **New → Web Service** → اربط الـ repository.
   - **Build Command:** اتركه فارغاً (لا يوجد بناء مطلوب)
   - **Start Command:** `node server.js`
3. بعد النشر، ستحصل على رابط مثل `carrier-crm.onrender.com`.
4. لربط دومينك الخاص: من إعدادات الخدمة اختر **Custom Domain**، أضف الدومين (مثل `crm.شركتك.com`)، ثم أضف سجل CNAME في إعدادات الدومين عندك (من لوحة تحكم الدومين، مثل GoDaddy أو Namecheap) يشير إلى الرابط الذي تعطيك إياه المنصة.

⚠️ **ملاحظة مهمة:** الخطط المجانية في بعض هذه المنصات "تُعيد تشغيل" الخدمة بعد فترة خمول، وقد تُفرّغ ملف البيانات في بعض الإعدادات. إذا كانت البيانات مهمة وتراكمية، اختر خطة مدفوعة بسيطة (عادة $5-7 شهرياً) تضمن وجود "قرص دائم" (Persistent Disk) — في Render هذا خيار اسمه Persistent Disk عند إضافة الخدمة.

### الطريقة الثانية: سيرفر خاص (VPS) — تحكم كامل

مثل DigitalOcean أو Linode أو أي VPS بنظام Ubuntu (تكلفة عادة $5-6 شهرياً).

1. **ارفع الملفات** إلى السيرفر (عبر `scp` أو Git):
   ```
   scp -r carrier-crm root@your-server-ip:/var/www/carrier-crm
   ```
2. **ثبّت Node.js** على السيرفر (إن لم يكن مثبتاً):
   ```
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
   sudo apt install -y nodejs
   ```
3. **شغّل التطبيق بشكل دائم** باستخدام PM2 (يبقيه يعمل حتى بعد إعادة تشغيل السيرفر):
   ```
   sudo npm install -g pm2
   cd /var/www/carrier-crm
   pm2 start server.js --name carrier-crm
   pm2 save
   pm2 startup
   ```
4. **اربط الدومين عبر Nginx** (لتوجيه الدومين إلى المنفذ 3000 مع SSL):
   ```
   sudo apt install -y nginx
   ```
   أنشئ ملف `/etc/nginx/sites-available/carrier-crm`:
   ```nginx
   server {
       listen 80;
       server_name crm.شركتك.com;
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   ثم فعّله:
   ```
   sudo ln -s /etc/nginx/sites-available/carrier-crm /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl restart nginx
   ```
5. **أضف SSL مجاني** (https) عبر Let's Encrypt:
   ```
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d crm.شركتك.com
   ```
6. **في لوحة تحكم الدومين:** أضف سجل A يشير إلى IP السيرفر.

### الطريقة الثالثة: استضافة مشتركة تدعم Node.js (cPanel)

بعض شركات الاستضافة (مثل Namecheap، Hostinger) توفر "Setup Node.js App" من لوحة cPanel:
1. ارفع ملفات المجلد عبر File Manager أو FTP.
2. من cPanel → Setup Node.js App → أنشئ تطبيق جديد، حدد `server.js` كملف البدء (Application Startup File)، واربطه بدومينك أو الدومين الفرعي.
3. اضغط Start/Restart.

---

## هيكل الملفات

```
carrier-crm/
  server.js          ← الخادم (Node.js فقط، بدون حزم خارجية)
  package.json
  data/
    records.json     ← كل البيانات تُحفظ هنا
  public/
    index.html
    style.css
    app.js
```

## تعديل قوائم الخيارات (الموردين، العملاء، الموانئ...)

عدّل القوائم في أعلى ملف `public/app.js` (المتغيرات مثل `SUPPLIERS`, `CLIENTS`, `PORTS`...).

## نسخة احتياطية

البيانات كلها في ملف واحد: `data/records.json`. يمكنك نسخه بانتظام كنسخة احتياطية، أو استبداله لاستعادة نسخة سابقة.
