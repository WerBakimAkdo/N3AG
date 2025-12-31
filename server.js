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
    port: 465,
    secure: true, 
    auth: {
        user: 'n3ag.services@gmail.com',
        pass: 'wlxiwbkitilxfetp'
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
    },
    connectionTimeout: 15000 
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

// ŞİFRE SIFIRLAMA
app.post('/sifre-sifirla', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            return res.send("<script>alert('Kullanıcı bulunamadı!'); window.location.href='javascript:history.back()';</script>");
        }

        user.password = password;
        await user.save();

        const mailOptions = {
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: user.email,
            subject: 'N3AG - Şifreniz Güncellendi!',
            text: `Merhaba ${user.username}, şifreniz başarıyla değiştirildi.`
        };

        try {
            console.log("Mail gönderim denemesi başladı...");
            await transporter.sendMail(mailOptions);
            console.log("✅ Mail başarıyla iletildi.");
            res.send("<script>alert('Şifre güncellendi ve mail gönderildi!'); window.location.href='/index.html';</script>");
        } catch (mailErr) {
            console.error("❌ MAIL HATASI:", mailErr.message);
            res.send("<script>alert('Şifre değişti ama mail gönderilemedi (Hata: " + mailErr.message + ")'); window.location.href='/index.html';</script>");
        }

    } catch (err) {
        console.error("SİSTEM HATASI:", err);
        res.status(500).send("Sunucu hatası.");
    }
});

app.get('/kullanici-verisi', (req, res) => {
    if (req.session.user) res.json(req.session.user);
    else res.status(401).send("Yetkisiz");
});

app.listen(port, () => console.log(`Aktif port: ${port}`));