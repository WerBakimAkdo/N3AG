const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// --- 1. MONGODB BAĞLANTISI ---
const mongoURI = process.env.MONGO_URI || "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("🚀 MongoDB Bağlandı."));

// --- 2. MAIL AYARLARI ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: 'n3ag.services@gmail.com',
        pass: 'zuuf kbqb jmbk axzm' 
    }
});

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

// ŞİFRE SIFIRLAMA LİNKİ GÖNDERME
// server.js içindeki /sifre-hatirlat rotasını bununla değiştir
app.post('/sifre-hatirlat', async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            return res.send("<script>alert('Böyle bir kullanıcı bulunamadı!'); window.location.href='/sifre-talebi.html';</script>");
        }

        const host = req.get('host');
        // Render'da https üzerinden çalıştığımız için linki garantiye alıyoruz
        const resetLink = `https://${host}/sifre-yenileme.html?id=${user._id.toString()}`;

        const mailOptions = {
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: user.email,
            subject: 'N3AG - Şifre Sıfırlama',
            html: `
                <div style="background:#1a1a1a; color:white; padding:20px; border-radius:10px; font-family:sans-serif;">
                    <h2>N3AG Şifre Yenileme</h2>
                    <p>Merhaba ${user.username}, şifreni sıfırlamak için butona tıkla:</p>
                    <a href="${resetLink}" style="background:#00f2fe; color:black; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">Şifremi Sıfırla</a>
                </div>`
        };

        await transporter.sendMail(mailOptions);
        res.send("<script>alert('Sıfırlama linki e-posta adresinize gönderildi!'); window.location.href='/index.html';</script>");
    } catch (err) {
        console.error("Mail Hatası:", err);
        res.status(500).send("Sunucu hatası oluştu.");
    }
});
// YENİ ŞİFREYİ KAYDETME
app.post('/sifre-guncelle', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.send("<script>alert('Şifre güncellendi!'); window.location.href='/index.html';</script>");
    } catch (err) { res.status(500).send("Hata oluştu."); }
});

// Kayıt ve Giriş
app.post('/kayit-et', async (req, res) => { /* senin kayıt kodun */ });
app.post('/giris-yap', async (req, res) => { /* senin giriş kodun */ });

app.listen(port, () => console.log(`Aktif port: ${port}`));