const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 10000;

// --- 1. MONGODB BAĞLANTISI ---
const mongoURI = "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("🚀 MongoDB Bağlandı."));

// --- 2. MAIL AYARLARI ---
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,   // 🔥 BURASI
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});


console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS var mı?:", !!process.env.MAIL_PASS);



// --- 3. VERİ MODELİ ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
}));

// --- 4. MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({ secret: 'n3ag-ozel', resave: false, saveUninitialized: true }));

// --- 5. ROTALAR ---


app.post('/sifre-hatirlat', async (req, res) => {
    try {
        const { identifier } = req.body;

        console.log("📩 Şifre isteği:", identifier);

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.send("<script>alert('Kullanıcı bulunamadı!'); window.location.href='/sifre-talebi.html';</script>");
        }

        console.log("👤 Kullanıcı bulundu:", user.email);

        const resetLink = `${req.protocol}://${req.get('host')}/sifre-yenileme.html?id=${user._id}`;

        console.log("📨 Mail gönderiliyor...");

  const info = await transporter.sendMail({
    from: '"N3AG Destek" <n3ag.services@gmail.com>',
    to: user.email,
    subject: 'N3AG - Şifre Sıfırlama',
    html: `<p>Şifre sıfırlamak için:</p>
           <a href="${resetLink}">${resetLink}</a>`
});

console.log("📬 MAIL INFO:", info);


        res.send("<script>alert('Mail gönderildi!'); window.location.href='/index.html';</script>");

    } catch (err) {
        console.error("❌ MAIL HATASI:", err);
        res.send("<script>alert('Mail gönderilemedi!'); window.location.href='/sifre-talebi.html';</script>");
    }
});

// KAYIT OLMA
app.post('/kayit-et', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.send("<script>alert('Kayıt Başarılı!'); window.location.href='/index.html';</script>");
    } catch (err) {
        res.send(`<script>alert('Hata: Kullanıcı adı veya e-posta zaten kullanımda!'); history.back();</script>`);
    }
});

// GİRİŞ YAPMA
app.post('/giris-yap', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        req.session.user = user;
        res.redirect('/panel.html');
    } else {
        res.send("<script>alert('Hatalı giriş!'); window.location.href='/index.html';</script>");
    }
});



// ŞİFREYİ GÜNCELLEME
app.post('/sifre-guncelle', async (req, res) => {
    try {
        console.log("📥 GELEN BODY:", req.body);

        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.send("❌ userId veya newPassword gelmedi");
        }

        await User.findByIdAndUpdate(userId, { password: newPassword });

        console.log("✅ ŞİFRE GÜNCELLENDİ:", userId);

        res.send("<script>alert('Şifre güncellendi!'); window.location.href='/index.html';</script>");
    } catch (err) {
        console.error("❌ GÜNCELLEME HATASI:", err);
        res.status(500).send("Hata");
    }
});


app.listen(port, () => console.log(`🚀 Sunucu ${port} portunda aktif.`));