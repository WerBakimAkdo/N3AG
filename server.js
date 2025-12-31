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
        pass: 'wlxiwbkitilxfetp' // Google 16 haneli Uygulama Şifresi
    },
    tls: { rejectUnauthorized: false }
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

// ... (Başlangıçtaki bağlantı ve mail ayarları aynı kalacak)

// --- ŞİFRE SIFIRLAMA LİNKİ GÖNDERME ---
app.post('/send-reset-link', async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

        if (!user) {
            return res.send("<script>alert('Böyle bir kullanıcı bulunamadı!'); window.location.href='/index.html';</script>");
        }

        const host = req.get('host');
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        // HTML dosya adının doğru olduğundan emin ol: sifre-yenile.html
        const resetLink = `${protocol}://${host}/sifre-yenile.html?id=${user._id}`;

        const mailOptions = {
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: user.email,
            subject: 'N3AG - Şifre Sıfırlama',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
                    <h2>Şifre Sıfırlama Talebi</h2>
                    <p>Merhaba ${user.username}, şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                    <a href="${resetLink}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Şifremi Sıfırla</a>
                </div>`
        };

        await transporter.sendMail(mailOptions);
        res.send("<script>alert('Sıfırlama linki mailinize gönderildi!'); window.location.href='/index.html';</script>");
    } catch (err) {
        console.error("Mail hatası:", err);
        res.status(500).send("Bir hata oluştu.");
    }
});

// --- YENİ ŞİFREYİ VERİTABANINA KAYDETME ---
app.post('/update-password', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        
        if (!userId || !newPassword) {
            return res.send("<script>alert('Geçersiz istek!'); window.location.href='/index.html';</script>");
        }

        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.send("<script>alert('Şifreniz güncellendi, şimdi giriş yapabilirsiniz.'); window.location.href='/index.html';</script>");
    } catch (err) {
        console.error(err);
        res.status(500).send("Güncellenemedi.");
    }
});

// KAYIT VE GİRİŞ ROTALARINI BURAYA EKLEMEYİ UNUTMA
app.post('/kayit-et', async (req, res) => { /* senin eski kayıt kodun */ });
app.post('/giris-yap', async (req, res) => { /* senin eski giriş kodun */ });

app.listen(port, () => console.log(`Aktif port: ${port}`));


// --- YENİ ŞİFREYİ VERİTABANINA KAYDETME ---
app.post('/update-password', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.send("<script>alert('Şifreniz güncellendi, şimdi giriş yapabilirsiniz.'); window.location.href='/index.html';</script>");
    } catch (err) {
        res.status(500).send("Güncellenemedi.");
    }
});

// YENİ ŞİFREYİ KAYDETME
app.post('/sifre-guncelle', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.send("<script>alert('Geçersiz istek!'); window.location.href='/index.html';</script>");
        }

        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.send("<script>alert('Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.'); window.location.href='/index.html';</script>");
        
    } catch (err) {
        res.status(500).send("Güncelleme hatası.");
    }
});

// DİĞER ROTALAR (Giriş, Kayıt vb.)
app.post('/kayit-et', async (req, res) => { /* Mevcut kodun aynısı */ });
app.post('/giris-yap', async (req, res) => { /* Mevcut kodun aynısı */ });

app.listen(port, () => console.log(`Aktif port: ${port}`));