const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

const mongoURI = process.env.MONGO_URI || "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";

mongoose.connect(mongoURI).then(() => console.log("🚀 MongoDB Bağlandı.")).catch(err => console.error(err));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({ secret: 'n3ag-ozel', resave: false, saveUninitialized: true }));

// KAYIT OLMA (Hem kullanıcı adı hem e-posta kontrolü)
app.post('/kayit-et', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // 1. Kullanıcı adı kontrolü
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.send(`
                <script>
                    localStorage.setItem('hata', 'Bu kullanıcı adı zaten alınmış!');
                    window.location.href = "/kayit.html";
                </script>
            `);
        }

        // 2. E-posta kontrolü (İstediğin ekleme burası)
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.send(`
                <script>
                    localStorage.setItem('hata', 'Bu e-posta adresi zaten kayıtlı!');
                    window.location.href = "/kayit.html";
                </script>
            `);
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
    if (user) { req.session.user = user; res.redirect('/panel.html'); }
    else { res.send("<script>alert('Hatalı giriş!'); window.location.href='/index.html';</script>"); }
});

// ŞİFRE SIFIRLAMA (Hem e-posta hem kullanıcı adı destekler)
app.post('/sifre-sifirla', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (user) {
            user.password = password;
            await user.save();
            res.send("<script>alert('Şifre güncellendi!'); window.location.href='/index.html';</script>");
        } else {
            res.send("<script>alert('Kullanıcı bulunamadı!'); window.location.href='javascript:history.back()';</script>");
        }
    } catch (err) { res.status(500).send("Hata: " + err.message); }
});

app.get('/kullanici-verisi', (req, res) => {
    if (req.session.user) res.json(req.session.user);
    else res.status(401).send("Yetkisiz");
});

app.listen(port, () => console.log(`Aktif port: ${port}`));