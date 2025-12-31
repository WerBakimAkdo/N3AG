const express = require('express');
const mongoose = require('mongoose'); // sqlite3 yerine bunu kullanıyoruz
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

// --- 1. MONGODB BAĞLANTISI ---
// <db_password> kısmına kendi şifreni yazmayı unutma!
// .net/ kısmından sonra istediğin ismi yazabilirsin
// Şifredeki noktayı ve özel karakterleri MongoDB'nin anlayacağı formata (encode) sokalım
const mongoURI = "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("🚀 MÜJDE! Veriler artık bulut sunucusunda (MongoDB)."))
    .catch(err => console.error("Bağlantı hatası:", err));

// --- 2. KULLANICI MODELİ (Tablo Yapısı) ---
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

// Kayıt Olma
app.post('/kayit-et', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.send("<h1>Kayıt Başarılı!</h1><p>Veriler artık bulutta saklanıyor.</p><a href='/index.html'>Giriş Yap</a>");
    } catch (err) {
        res.status(500).send("Kayıt hatası (Belki bu kullanıcı adı zaten var?): " + err.message);
    }
});

// Giriş Yapma
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

// Panel için Veri Çekme
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