const BACKEND = "https://mikgpt-v4-backend-production.up.railway.app/api/chat";
const $ = id=>document.getElementById(id);
const auth = firebase.auth();

const ui = {
  auth: $('auth-section'),
  chat: $('chat-wrapper'),
  msgs: $('chat-messages'),
  input: $('message-input'),
  form: $('message-form'),
  loader: $('loading-indicator'),
  toggle: $('toggleMode'),
  reset: $('resetChat'),
  download: $('downloadChat'),
  logout: $('logoutBtn'),
  signIn: $('signInBtn'),
  signUp: $('signUpBtn'),
  google: $('googleBtn'),
  email: $('emailInput'),
  pass: $('passwordInput'),
  themeLink: $('themeStylesheet')
};

auth.onAuthStateChanged(u=>{
  if(u){ ui.auth.classList.add('hidden'); ui.chat.classList.remove('hidden'); }
  else{ ui.chat.classList.add('hidden'); ui.auth.classList.remove('hidden');}
});

ui.signIn.onclick=()=>auth.signInWithEmailAndPassword(ui.email.value,ui.pass.value).catch(alert);
ui.signUp.onclick=()=>auth.createUserWithEmailAndPassword(ui.email.value,ui.pass.value).catch(alert);
ui.google.onclick=()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(alert);
ui.logout.onclick=()=>auth.signOut();

ui.toggle.onclick=()=>{
  const isDark = document.body.classList.toggle('dark');
  ui.themeLink.href = isDark?'css/dark.css':'css/light.css';
  ui.toggle.textContent = isDark?'☀️':'🌙';
};

ui.reset.onclick=()=> ui.msgs.innerHTML='';

ui.download.onclick=()=>{
  const text = [...ui.msgs.querySelectorAll('.message')].map(m=>m.textContent).join('\\n');
  const blob = new Blob([text],{type:'text/plain'});
  const a=document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mikgpt.txt';
  a.click();
};

ui.form.onsubmit=async e=>{
  e.preventDefault();
  const txt = ui.input.value.trim();
  if(!txt)return;
  const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  ui.input.value='';
  render('user',txt,time);
  ui.loader.classList.remove('hidden');

  try{
    const res=await fetch(BACKEND,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:txt})});
    const d=await res.json();
    renderTyping('bot',d.status==='success'?d.response:'❌ Error',time);
  }catch{
    render('bot','🚫 Connection failed',time);
  }
};

function render(sender,text,time){
  const c=document.createElement('div');
  c.className=`message-container ${sender}`;
  const b=document.createElement('div');
  b.className='message';
  b.textContent=text;
  const t=document.createElement('div');
  t.className='timestamp';
  t.textContent=time;
  c.append(b,t);
  ui.msgs.insertBefore(c,ui.loader);
  ui.msgs.scrollTop = ui.msgs.scrollHeight;
  ui.loader.classList.add('hidden');
}

function renderTyping(sender,msg,time){
  const c=document.createElement('div');
  c.className=`message-container ${sender}`;
  const b=document.createElement('div');
  b.className='message';
  const t=document.createElement('div');
  t.className='timestamp';
  t.textContent = time;
  c.append(b,t);
  ui.msgs.insertBefore(c,ui.loader);
  let i=0;
  const iv = setInterval(()=>{
    if(i<msg.length){b.textContent+=msg[i++]; ui.msgs.scrollTop = ui.msgs.scrollHeight;}
    else { clearInterval(iv); ui.loader.classList.add('hidden'); }
  },15);
}

const toggleBtn = document.getElementById("toggleMode");
const themeLink = document.getElementById("themeStylesheet");

const savedTheme = localStorage.getItem("theme") || "light";
themeLink.href = `css/${savedTheme}.css`;
toggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";

toggleBtn.addEventListener("click", () => {
  const current = themeLink.href.includes("dark") ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  themeLink.href = `css/${next}.css`;
  localStorage.setItem("theme", next);
  toggleBtn.textContent = next === "dark" ? "☀️" : "🌙";
});
