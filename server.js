const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 10000;

// --- MONGODB BAĞLANTISI ---
const mongoURI = "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";
mongoose.connect(mongoURI)
  .then(() => console.log("🚀 MongoDB Bağlandı."))
  .catch(err => console.error("❌ MongoDB Hatası:", err));

// --- MAIL AYARLARI ---
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// --- USER MODEL ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(session({ secret: 'n3ag-ozel', resave: false, saveUninitialized: true }));

// --- ROUTES ---


// GİRİŞ YAP
app.post('/giris-yap', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if(user){
            req.session.user = user;
            res.json({ success:true, redirect:'/panel.html', message:'Giriş başarılı!' });
        } else {
            res.json({ success:false, message:'Hatalı giriş!' });
        }
    } catch(err){
        console.error('❌ GİRİŞ HATASI:', err);
        res.json({ success:false, message:'Sunucu hatası!' });
    }
});

// KAYIT OL
// KAYIT OL
app.post('/kayit-et', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email, password });
        await newUser.save();

        // kayıt maili
        const mailHTML = `
        <div style="font-family: Arial, sans-serif; color:#222; padding:20px; background:#f4f4f4;">
          <h2 style="color:#111;">N3AG Kayıt Başarılı</h2>
          <p>Merhaba <strong>${username}</strong>,</p>
          <p>Hesabın başarıyla oluşturuldu. Artık giriş yapabilirsin.</p>
          <a href="${req.protocol}://${req.get('host')}/index.html" 
             style="display:inline-block; padding:12px 24px; background:#1e90ff; color:white; text-decoration:none; border-radius:6px; margin-top:10px;">
             Giriş Yap
          </a>
        </div>
        `;

        await transporter.sendMail({
            from: '"N3AG Destek" <n3ag.services@gmail.com>',
            to: email,
            subject: 'N3AG - Kayıt Başarılı',
            html: mailHTML
        });

        res.json({ success:true, redirect:'/index.html', message:'Kayıt başarılı! Mail adresine giriş linki gönderildi.' });

    } catch (err) {
        res.json({ success:false, message:'Kullanıcı adı veya e-posta kullanımda!' });
    }
});


// ŞİFRE HATIRLAT
app.post('/sifre-hatirlat', async (req, res) => {
    try {
        const { identifier } = req.body;
        const user = await User.findOne({ $or:[ {email:identifier}, {username:identifier} ] });

        if(!user) return res.json({ success:false, message:'Kullanıcı bulunamadı!' });

        const resetLink = `${req.protocol}://${req.get('host')}/sifre-yenileme.html?id=${user._id}`;

        const mailHTML = `
        <div style="font-family: Arial, sans-serif; color:#222; padding:20px; background:#f4f4f4;">
          <h2 style="color:#111;">N3AG Şifre Sıfırlama</h2>
          <p>Merhaba <strong>${user.username}</strong>,</p>
          <p>Şifreni sıfırlamak için aşağıdaki butona tıkla:</p>
          <a href="${resetLink}" 
             style="display:inline-block; padding:12px 24px; background:#1e90ff; color:white; text-decoration:none; border-radius:6px; margin-top:10px;">
             Şifreyi Sıfırla
          </a>
          <p style="margin-top:20px; font-size:12px; color:#555;">
            Eğer bu işlemi sen yapmadıysan, bu maili görmezden gel.
          </p>
        </div>
        `;

       const info = await transporter.sendMail({
  from: '"N3AG Destek" <n3ag.services@gmail.com>',
  to: user.email,
  subject: 'N3AG - Şifre Sıfırlama',
  html: `<p>Merhaba <b>${user.username}</b>,</p>
         <p>Şifre sıfırlamak için aşağıdaki linke tıkla:</p>
         <a href="${resetLink}" style="color:#8f9bff;text-decoration:none;">Şifreyi Sıfırla</a>`
});
res.json({ success:true, message:'Mail gönderildi!' });


        res.json({ success:true, message:'Şifre sıfırlama maili gönderildi!' });

    } catch(err){
        console.error('❌ MAIL HATASI:', err);
        res.json({ success:false, message:'Mail gönderilemedi!' });
    }
});

// ŞİFRE GÜNCELLEME
app.post('/sifre-guncelle', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        if(!userId || !newPassword) return res.json({ success:false, message:'Eksik veri!' });
        await User.findByIdAndUpdate(userId, { password: newPassword });
        res.json({ success:true, message:'Şifre güncellendi!' });
    } catch(err){
        console.error('❌ GÜNCELLEME HATASI:', err);
        res.json({ success:false, message:'Hata oluştu!' });
    }
});

app.listen(port, () => console.log(`🚀 Sunucu ${port} portunda aktif.`));
