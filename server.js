const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
// RENDER UYUMU: Render kendi portunu verir, yoksa 3000 kullan
const port = process.env.PORT || 3000;

// --- 1. MONGODB BAĞLANTISI ---
// RENDER UYUMU: Şifreyi Render panelindeki MONGO_URI'den çek, yoksa buradakini kullan
const mongoURI = process.env.MONGO_URI || "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("🚀 MÜJDE! Veriler artık bulut sunucusunda (MongoDB)."))
    .catch(err => console.error("Bağlantı hatası:", err));

// --- 2. KULLANICI MODELİ ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// --- 3. MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({
    secret: 'n3ag-ozel-anahtar',
    resave: false,
    saveUninitialized: true
}));

// --- 4. ROTALAR ---

// KAYIT OLMA
app.post('/kayit-et', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        
        res.send(`
            <script>
                alert("Kayıt Başarılı! Veriler buluta uçtu. Şimdi giriş yapabilirsin.");
                window.location.href = "/index.html";
            </script>
        `);
    } catch (err) {
        res.status(500).send(`
            <div style="font-family: Arial; text-align: center; margin-top: 50px;">
                <h2 style="color: red;">Kayıt Hatası!</h2>
                <p>Bu kullanıcı adı alınmış olabilir: ${err.message}</p>
                <a href="javascript:history.back()">Geri Dön ve Tekrar Dene</a>
            </div>
        `);
    }
});

// GİRİŞ YAPMA
app.post('/giris-yap', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        
        if (user) {
            req.session.user = user;
            res.redirect('/panel.html');
        } else {
            res.send("<script>alert('Hatalı kullanıcı adı veya şifre!'); window.location.href='/index.html';</script>");
        }
    } catch (err) {
        res.status(500).send("Sistem hatası!");
    }
});

// EKSİK OLAN: ŞİFRE SIFIRLAMA
app.post('/sifre-sifirla', async (req, res) => {
    try {
        const { email, newPassword } = req.body; // HTML formundaki name kısımları bunlar olmalı
        const user = await User.findOne({ email: email });

        if (user) {
            user.password = newPassword;
            await user.save();
            res.send("<script>alert('Şifreniz başarıyla güncellendi!'); window.location.href='/index.html';</script>");
        } else {
            res.send("<script>alert('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı!'); window.location.href='javascript:history.back()';</script>");
        }
    } catch (err) {
        res.status(500).send("Şifre sıfırlama sırasında hata oluştu: " + err.message);
    }
});

// Panel verisi
app.get('/kullanici-verisi', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).send("Giriş yapmalısın.");
    }
});

app.listen(port, () => {
    console.log(`Sunucu aktif: http://localhost:${port}`);
});