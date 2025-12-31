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
app.post('/sifre-hatirlat', async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) return res.send("<script>alert('Kullanıcı bulunamadı!'); window.location.href='/index.html';</script>");

        // app.js içinde resetLink satırını tam olarak şununla değiştir:
const host = req.get('host');
const protocol = req.headers['x-forwarded-proto'] || 'https'; // Render için güvenli protokol
const resetLink = `${protocol}://${host}/sifre-yenileme.html?id=${user._id.toString()}`;

        const mailOptions = {
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: user.email,
            subject: 'N3AG - Şifre Sıfırlama',
            html: `<h3>Merhaba ${user.username},</h3>
                   <p>Şifreni sıfırlamak için butona tıkla:</p>
                   <a href="${resetLink}" style="background:#28a745;color:white;padding:10px;text-decoration:none;border-radius:5px;">Şifremi Sıfırla</a>`
        };

        await transporter.sendMail(mailOptions);
        res.send("<script>alert('Mail gönderildi!'); window.location.href='/index.html';</script>");
    } catch (err) { res.status(500).send("Hata: " + err.message); }
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