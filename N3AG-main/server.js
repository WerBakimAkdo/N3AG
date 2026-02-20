const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 10000;

/* =======================
   MONGODB
======================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch(err => console.error("MongoDB hata:", err));

/* =======================
   MIDDLEWARE
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'n3ag-secret',
  resave: false,
  saveUninitialized: true 
}));

app.use(express.static(__dirname));
app.use('/indir', express.static(path.join(__dirname, 'indir')));

/* =======================
   USER MODEL
======================= */
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true },
  email: String,
  password: String,
  resetToken: String,
  resetExpire: Date
}));

/* =======================
   AKTİF KULLANICI TAKİBİ
======================= */
let activeUsers = new Set();
app.get('/api/ping', (req, res) => {
    activeUsers.add(req.sessionID);
    res.json({ success: true });
});
app.get('/api/active-users', (req, res) => {
    res.json({ count: activeUsers.size });
});
setInterval(() => { activeUsers.clear(); }, 120000);

/* =======================
   KAYIT / GİRİŞ (ESKİ VE SAĞLAM)
======================= */
app.post('/kayit-ol', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ username })) return res.json({ success: false, message: "Bu kullanıcı adı alınmış" });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashed });
    res.json({ success: true, message: "Kayıt başarılı!" });
  } catch (err) { res.json({ success: false, message: "Sunucu hatası" }); }
});

app.post('/giris-yap', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.json({ success: false, message: "Hatalı bilgi" });
    }
    req.session.user = user._id;
    res.json({ success: true, redirect: "/programs.html", message: "Giriş başarılı" });
  } catch (err) { res.json({ success: false, message: "Sunucu hatası" }); }
});

/* =======================
   ŞİFRE SIFIRLAMA (BREVO MAİL DESTEKLİ)
======================= */
app.post('/sifre-hatirlat', async (req, res) => {
  try {
    const { identifier } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) return res.json({ success: false, message: "Kullanıcı bulunamadı" });
    
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetExpire = Date.now() + 15 * 60 * 1000;
    await user.save();
    
    const resetLink = `https://n3ag.onrender.com/sifre-yenileme.html?token=${token}`;
    
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 
        'accept': 'application/json', 
        'api-key': process.env.BREVO_API_KEY, 
        'content-type': 'application/json' 
      },
      body: JSON.stringify({
        sender: { name: "N3AG", email: "n3ag.services@gmail.com" },
        to: [{ email: user.email }],
        subject: "Şifre Sıfırlama",
        htmlContent: `<p>Merhaba ${user.username},</p><p>Şifreni sıfırlamak için:</p><a href="${resetLink}">Şifreyi Yenile</a>`
      })
    });
    res.json({ success: true, message: "Şifre sıfırlama maili gönderildi" });
  } catch (err) { res.json({ success: false, message: "Mail gönderilemedi" }); }
});

app.post('/sifre-yenile', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ resetToken: token, resetExpire: { $gt: Date.now() } });
    if (!user) return res.json({ success: false, message: "Link geçersiz veya süresi dolmuş" });
    
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpire = undefined;
    await user.save();
    res.json({ success: true, message: "Şifre başarıyla değiştirildi" });
  } catch (err) { res.json({ success: false, message: "Sunucu hatası" }); }
});

/* =======================
   PROFİL ROTALARI
======================= */
app.get('/api/user-info', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false });
    const user = await User.findById(req.session.user).select('-password');
    res.json({ success: true, user });
});

app.post('/api/update-password', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false });
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.session.user);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.json({ success: false, message: "Eski şifre hatalı!" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Şifre güncellendi!" });
});

/* =======================
   SAYFA YÖNLENDİRMELERİ
======================= */
app.get('/programs.html', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'programs.html'));
});

app.get('/profile.html', (req, res) => {
    if (!req.session.user) return res.redirect('/');
    res.sendFile(path.join(__dirname, 'profile.html'));
});
const axios = require('axios'); // Eğer axios yüklü değilse 'npm install axios' yap

// Kendi sunucuna 10 dakikada bir istek atar
setInterval(async () => {
    try {
        await axios.get(`https://n3ag.onrender.com/api/active-users`);
        console.log("Sistem canlı tutuluyor...");
    } catch (e) {
        console.log("Uyandırma hatası (Normal olabilir):", e.message);
    }
}, 600000); // 10 dakika
app.listen(PORT, () => { console.log("Server aktif:", PORT); });