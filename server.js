const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 10000;

// MongoDB
const mongoURI = "mongodb+srv://shizophrendevil:Migrosvsa101@n3ag.a2fwajs.mongodb.net/N3AG_Project?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(()=>console.log("MongoDB Bağlandı."));

// Mail
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

// Model
const User = mongoose.model('User', new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    email:{type:String,required:true},
    password:{type:String,required:true}
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(express.static(path.join(__dirname)));
app.use(session({ secret:'n3ag-ozel', resave:false, saveUninitialized:true }));

// REGISTER
app.post('/kayit-et', async (req,res)=>{
    try{
        const { username,email,password } = req.body;
        const user = new User({ username,email,password });
        await user.save();
        res.json({ success:true, message:`${username} başarıyla kaydedildi!`, redirect:'/index.html' });
    }catch(err){
        res.json({ success:false, message:'Hata: Kullanıcı adı veya e-posta kullanımda!' });
    }
});

// LOGIN
app.post('/giris-yap', async (req,res)=>{
    try{
        const { username,password } = req.body;
        const user = await User.findOne({ username,password });
        if(user){
            req.session.user = user;
            res.json({ success:true, redirect:'/panel.html', message:'Giriş başarılı!' });
        }else res.json({ success:false, message:'Hatalı giriş!' });
    }catch(err){
        res.json({ success:false, message:'Sunucu hatası!' });
    }
});

// FORGOT
app.post('/sifre-hatirlat', async (req,res)=>{
    try{
        const { identifier } = req.body;
        const user = await User.findOne({ $or:[{email:identifier},{username:identifier}] });
        if(!user) return res.json({ success:false, message:'Kullanıcı bulunamadı!' });

        const resetLink = `${req.protocol}://${req.get('host')}/sifre-yenileme.html?id=${user._id}`;
        await transporter.sendMail({
            from:'"N3AG Destek" <n3ag.services@gmail.com>',
            to:user.email,
            subject:'N3AG - Şifre Sıfırlama',
            html:`<p>Merhaba ${user.username}, şifreni sıfırlamak için tıkla:</p><a href="${resetLink}">${resetLink}</a>`
        });
        res.json({ success:true, message:'Mail gönderildi!' });
    }catch(err){
        res.json({ success:false, message:'Mail gönderilemedi!' });
    }
});

// ŞİFRE YENİLEME (GET id ile sayfa açılır)
app.get('/sifre-yenileme.html', (req,res)=>{
    res.sendFile(path.join(__dirname,'sifre-yenileme.html'));
});

// ŞİFRE GÜNCELLEME
app.post('/sifre-guncelle', async (req,res)=>{
    try{
        const { userId,newPassword } = req.body;
        if(!userId || !newPassword) return res.json({ success:false, message:'Eksik bilgi!' });
        await User.findByIdAndUpdate(userId,{password:newPassword});
        res.json({ success:true, message:'Şifre güncellendi! Giriş yapabilirsiniz.', redirect:'/index.html' });
    }catch(err){ res.json({ success:false, message:'Hata oluştu!' }); }
});

app.listen(port, ()=>console.log(`Sunucu ${port} portunda aktif.`));
