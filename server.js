const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// --- 1. MONGODB BAĞLANTISI ---
const mongoURI = process.env.MONGO_URI || "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("🚀 MongoDB Bağlandı."))
    .catch(err => console.error("Bağlantı hatası:", err));

// --- 2. MAIL AYARLARI ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'n3ag.services@gmail.com',
        pass: 'wlxiwbkitilxfetp' // Not: Uygulama şifresi kullandığınızdan emin olun
    },
    tls: {
        rejectUnauthorized: false
    }
});

// --- 3. VERİ MODELİ ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- 4. MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({ secret: 'n3ag-ozel', resave: false, saveUninitialized: true }));

// --- 5. ROTALAR ---

// KAYIT OLMA
app.post('/kayit-et', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.send("<script>alert('Kayıt Başarılı!'); window.location.href='/index.html';</script>");
    } catch (err) { 
        res.status(500).send("Hata: " + err.message); 
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

// ŞİFRE SIFIRLAMA MAİLİ GÖNDERME
app.post('/sifre-hatirlat', async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            return res.send("<script>alert('Böyle bir kullanıcı bulunamadı!'); window.location.href='javascript:history.back()';</script>");
        }

        // Kullanıcı ID'si ile sıfırlama linki oluşturma
        const resetLink = `http://localhost:${port}/sifre-yenile.html?id=${user._id}`;

        const mailOptions = {
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: user.email,
            subject: 'N3AG - Şifre Sıfırlama',
            html: `
                <h3>Merhaba ${user.username},</h3>
                <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p>
                <a href="${resetLink}">Şifremi Sıfırla</a>
            `
        };

        await transporter.sendMail(mailOptions);
        res.send("<script>alert('Sıfırlama linki mail adresinize gönderildi!'); window.location.href='/index.html';</script>");

    } catch (err) {
        console.error("Mail Hatası:", err);
        res.status(500).send("İşlem sırasında bir hata oluştu.");
    }
});

// YENİ ŞİFREYİ KAYDETME
app.post('/sifre-guncelle', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId) return res.status(400).send("Geçersiz istek.");

        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.send("<script>alert('Şifreniz güncellendi!'); window.location.href='/index.html';</script>");
    } catch (err) {
        res.status(500).send("Güncelleme hatası.");
    }
});

app.listen(port, () => console.log(`Sunucu aktif: ${port}`));