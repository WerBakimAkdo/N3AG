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
    secure: false, // 587 portu için false olmalı
    auth: {
        user: 'n3ag.services@gmail.com',
        pass: 'wlxiwbkitilxfetp'
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
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
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send(`<script>localStorage.setItem('hata', 'Bu kullanıcı adı zaten alınmış!'); window.location.href = "/kayit.html";</script>`);
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.send(`<script>localStorage.setItem('hata', 'Bu e-posta adresi zaten kayıtlı!'); window.location.href = "/kayit.html";</script>`);
        }
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

// --- 5. ŞİFRE HATIRLATMA (GÜVENLİ VE MAİLLİ) ---
app.post('/sifre-hatirlat', async (req, res) => {
    try {
        const { identifier } = req.body; // Sadece mail veya kullanıcı adı alıyoruz
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            return res.send("<script>alert('Böyle bir kullanıcı bulunamadı!'); window.location.href='javascript:history.back()';</script>");
        }

        const mailOptions = {
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: user.email,
            subject: 'N3AG - Şifre Hatırlatma',
            html: `
                <h3>Merhaba ${user.username},</h3>
                <p>Şifreni unuttuğunu duyduk. İşte güncel giriş bilgilerin:</p>
                <p><b>Kullanıcı Adı:</b> ${user.username}</p>
                <p><b>Şifre:</b> ${user.password}</p>
                <br>
                <p>Güvenliğin için bu bilgileri kimseyle paylaşma.</p>
            `
        };

        try {
            console.log("Şifre hatırlatma maili gönderiliyor...");
            await transporter.sendMail(mailOptions);
            res.send("<script>alert('Şifreniz kayıtlı e-posta adresinize gönderildi!'); window.location.href='/index.html';</script>");
        } catch (mailErr) {
            console.error("Mail Hatası:", mailErr.message);
            res.send("<script>alert('Mail gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'); window.location.href='javascript:history.back()';</script>");
        }

    } catch (err) {
        res.status(500).send("Sunucu hatası.");
    }
});
app.get('/kullanici-verisi', (req, res) => {
    if (req.session.user) res.json(req.session.user);
    else res.status(401).send("Yetkisiz");
});

app.listen(port, () => console.log(`Aktif port: ${port}`));