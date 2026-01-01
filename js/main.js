// Giriş / Kayıt / Şifre unuttum index.js
const login = document.getElementById("loginForm");
const register = document.getElementById("registerForm");
const forgot = document.getElementById("forgotForm");

// Form switch
function switchForm() {
  login.classList.toggle("active");
  register.classList.toggle("active");
}
function showForgot() {
  login.classList.remove("active");
  forgot.classList.add("active");
}
function backLogin() {
  forgot.classList.remove("active");
  login.classList.add("active");
}

// AJAX submit (index)
if(login) login.addEventListener('submit', async function(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const res = await fetch('/giris-yap', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  const result = await res.json();
  if(result.success && result.redirect) window.location.href = result.redirect;
  else alert(result.message);
});

if(register) register.addEventListener('submit', async function(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const res = await fetch('/kayit-et', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  const result = await res.json();
  if(result.success && result.redirect) window.location.href = result.redirect;
  else alert(result.message);
});

if(forgot) forgot.addEventListener('submit', async function(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const res = await fetch('/sifre-hatirlat', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  const result = await res.json();
  alert(result.message);
});

// AJAX submit (sifre-yenileme)
const resetForm = document.getElementById('resetForm');
if(resetForm){
  resetForm.addEventListener('submit', async function(e){
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this));
    const res = await fetch('/sifre-guncelle', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    const result = await res.json();
    const msgDiv = document.getElementById('message');
    if(result.success){
      msgDiv.innerHTML = `<span style="color:#1eff00;">✅ ${result.message}</span>`;
      setTimeout(()=>window.location.href='/index.html',2000);
    }else{
      msgDiv.innerHTML = `<span style="color:#ff4d4d;">❌ ${result.message}</span>`;
    }
  });
}
