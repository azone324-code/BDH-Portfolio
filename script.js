/* BDH Portfolio v4 — GitHub Pages + Supabase */
const { createClient } = window.supabase;
const SUPABASE_READY = window.BDH_SUPABASE_URL && !window.BDH_SUPABASE_URL.includes('YOUR-PROJECT') && window.BDH_SUPABASE_ANON_KEY && !window.BDH_SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
const sb = SUPABASE_READY ? createClient(window.BDH_SUPABASE_URL, window.BDH_SUPABASE_ANON_KEY) : null;

const fallback = {
  tagline: 'A creative home for Bengali fan dubbing, voice artists and storytellers.',
  facebook: 'https://www.facebook.com',
  logo_url: 'assets/bdh-logo.jpg'
};
let site = {...fallback}, admins = [], members = [], works = [], session = null, isAdmin = false;

const $ = (s) => document.querySelector(s);
const esc = (s='') => String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const safeUrl = (s='') => { try { const u = new URL(s, location.href); return ['http:','https:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } };
const pic = (src, alt='') => src ? `<div class="pic"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></div>` : '<div class="pic">PHOTO</div>';

function openModal(content){ $('#modalContent').innerHTML=content; $('#modal').classList.remove('hidden'); $('#modal').setAttribute('aria-hidden','false'); }
function closeModal(){ $('#modal').classList.add('hidden'); $('#modal').setAttribute('aria-hidden','true'); }
$('#closeModal').onclick=closeModal;
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});

async function loadPublic(){
  if(!sb) { site=fallback; admins=[]; members=[]; works=[]; render(); return; }
  const [s,a,m,w] = await Promise.all([
    sb.from('site_settings').select('tagline,facebook,logo_url').eq('id',1).maybeSingle(),
    sb.from('admins').select('id,name,role,bio,photo_url,facebook,instagram').order('created_at',{ascending:true}),
    sb.from('members').select('id,name,role,bio,photo_url,facebook,instagram,videos').order('created_at',{ascending:true}),
    sb.from('works').select('id,title,type,url').order('created_at',{ascending:true})
  ]);
  if(s.error) console.warn(s.error); else if(s.data) site={...fallback,...s.data};
  admins=a.data||[]; members=m.data||[]; works=w.data||[];
  render();
}

function render(){
  $('#tagline').textContent=site.tagline||fallback.tagline;
  $('#fbContact').href=safeUrl(site.facebook||fallback.facebook);
  const logo=site.logo_url||fallback.logo_url; $('#siteLogo').src=logo; $('#brandLogo').src=logo;
  $('#adminGrid').innerHTML=admins.length ? admins.map((a,i)=>`<article class="card clickable" onclick="viewAdmin(${i})">${pic(a.photo_url,a.name)}<div class="info"><span class="arrow">↗</span><h3>${esc(a.name)}</h3><div class="role">${esc(a.role)}</div><p class="bio">${esc(a.bio)}</p></div></article>`).join('') : emptyCard('Admin profiles will appear here.');
  $('#memberGrid').innerHTML=members.length ? members.map((m,i)=>`<article class="card clickable" onclick="viewMember(${i})">${pic(m.photo_url,m.name)}<div class="info"><span class="arrow">↗</span><h3>${esc(m.name)}</h3><div class="role">${esc(m.role)}</div><p class="bio">${esc(m.bio)}</p></div></article>`).join('') : emptyCard('Members will appear here.');
  $('#workGrid').innerHTML=works.length ? works.map(w=>`<article class="card work">${w.url?`<a href="${safeUrl(w.url)}" target="_blank" rel="noopener"><div class="video">▶ WATCH</div></a>`:`<div class="video">VIDEO</div>`}<h3>${esc(w.title)}</h3><p>${esc(w.type)}</p></article>`).join('') : emptyCard('Featured works will appear here.');
}
function emptyCard(t){return `<div class="empty">${esc(t)}</div>`}

window.viewAdmin=function(i){const a=admins[i]; openModal(`${pic(a.photo_url,a.name)}<div class="info"><p class="eyebrow">BDH ADMIN</p><h2>${esc(a.name)}</h2><div class="role">${esc(a.role)}</div><p class="bio">${esc(a.bio)}</p><div class="socials">${a.facebook?`<a class="btn small" href="${safeUrl(a.facebook)}" target="_blank" rel="noopener">Facebook</a>`:''}${a.instagram?`<a class="btn small" href="${safeUrl(a.instagram)}" target="_blank" rel="noopener">Instagram</a>`:''}</div></div>`)};
window.viewMember=function(i){const m=members[i]; openModal(`${pic(m.photo_url,m.name)}<div class="info"><p class="eyebrow">BDH MEMBER</p><h2>${esc(m.name)}</h2><div class="role">${esc(m.role)}</div><p class="bio">${esc(m.bio)}</p><div class="socials">${m.facebook?`<a class="btn small" href="${safeUrl(m.facebook)}" target="_blank" rel="noopener">Facebook</a>`:''}${m.instagram?`<a class="btn small" href="${safeUrl(m.instagram)}" target="_blank" rel="noopener">Instagram</a>`:''}</div><h3>Featured Works</h3>${(m.videos||[]).map(v=>`<p><a class="btn small" href="${safeUrl(v)}" target="_blank" rel="noopener">▶ Watch Video</a></p>`).join('')||'<p class="hint">No videos added yet.</p>'}</div>`) };

async function adminExists(){ if(!sb) return false; const {count,error}=await sb.from('admins').select('id',{count:'exact',head:true}); if(error) throw error; return (count||0)>0; }

async function openAdmin(){
  if(!sb){ openModal(setupConfigView()); return; }
  const {data:{session:s}}=await sb.auth.getSession(); session=s;
  if(session){ const {data}=await sb.from('admins').select('id').eq('id',session.user.id).maybeSingle(); isAdmin=!!data; if(isAdmin){await adminPanel();return;} await sb.auth.signOut(); }
  let exists=false; try{exists=await adminExists()}catch(e){openModal(errorView('Could not check the Admin system. Run supabase.sql first.'));return;}
  openModal(exists?loginView():setupView());
}
function setupConfigView(){return `<div class="form"><h2>BDH Admin Setup</h2><p class="hint">Add your Supabase URL and anon key to <b>supabase-config.js</b>, then run the included SQL setup in Supabase.</p></div>`}
function loginView(msg=''){return `<div class="form auth"><p class="eyebrow">PRIVATE AREA</p><h2>🔒 Admin Login</h2><p class="hint">Only an approved BDH admin account can enter the dashboard.</p>${msg?`<div class="error">${esc(msg)}</div>`:''}<label>Email</label><input id="loginEmail" type="email" autocomplete="username" placeholder="Admin email"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password" placeholder="Password"><button id="loginSubmit">Login</button></div>`}
function setupView(){return `<div class="form auth"><p class="eyebrow">FIRST-TIME SETUP</p><h2>🔐 Create BDH Admin</h2><p class="hint">This screen appears only while the Supabase database has no Admin profile. Create the first admin account now.</p><div class="warning">Do this yourself before sharing the GitHub Pages URL. After the first admin exists, every other visitor sees Login only.</div><label>Admin name</label><input id="setupName" placeholder="Your name"><label>Email</label><input id="setupEmail" type="email" autocomplete="username" placeholder="Your admin email"><label>Password</label><input id="setupPassword" type="password" autocomplete="new-password" placeholder="At least 8 characters"><label>Confirm password</label><input id="setupConfirm" type="password" autocomplete="new-password" placeholder="Repeat password"><button id="setupSubmit">Create Admin Account</button></div>`}
function errorView(t){return `<div class="form"><h2>Something went wrong</h2><p class="error">${esc(t)}</p><button onclick="openAdmin()">Try Again</button></div>`}

async function doLogin(){const email=$('#loginEmail').value.trim(), password=$('#loginPassword').value; const btn=$('#loginSubmit'); btn.disabled=true; btn.textContent='Signing in…'; const {data,error}=await sb.auth.signInWithPassword({email,password}); if(error){openModal(loginView(error.message));return;} session=data.session; const {data:profile}=await sb.from('admins').select('id').eq('id',data.user.id).maybeSingle(); if(!profile){await sb.auth.signOut();openModal(loginView('This account is not a BDH admin.'));return;} isAdmin=true; await adminPanel();}
async function doSetup(){const name=$('#setupName').value.trim(), email=$('#setupEmail').value.trim(), p=$('#setupPassword').value, c=$('#setupConfirm').value; if(!name||!email||p.length<8||p!==c){openModal(setupView()); setTimeout(()=>{const e=$('.auth'); if(e)e.insertAdjacentHTML('beforeend','<p class="error">Enter all fields, use an 8+ character password, and make both passwords match.</p>')},0); return;} const btn=$('#setupSubmit');btn.disabled=true;btn.textContent='Creating…'; const {data,error}=await sb.auth.signUp({email,password:p,options:{data:{display_name:name}}}); if(error){openModal(setupView()); setTimeout(()=>$('.auth').insertAdjacentHTML('beforeend',`<p class="error">${esc(error.message)}</p>`),0);return;} if(data.session){await refreshAdminAndOpen(data.user.id)} else {openModal(loginView('Account created. Check your email if Supabase email confirmation is enabled, then log in.'))}}
async function refreshAdminAndOpen(uid){const {data:profile}=await sb.from('admins').select('id').eq('id',uid).maybeSingle(); if(profile){isAdmin=true;await adminPanel()}else{openModal(loginView('Admin profile was not created. Make sure the included SQL trigger is installed.'))}}

document.addEventListener('click',e=>{if(e.target.id==='loginSubmit')doLogin(); if(e.target.id==='setupSubmit')doSetup()});

async function uploadImage(file){if(!file)return ''; if(!session||!isAdmin)throw new Error('Admin login required.'); const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,''); const path=`${crypto.randomUUID()}.${ext||'jpg'}`; const {error}=await sb.storage.from('bdh-assets').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type}); if(error)throw error; const {data}=sb.storage.from('bdh-assets').getPublicUrl(path); return data.publicUrl;}

async function adminPanel(){
  const [{data:s},{data:a},{data:m},{data:w}] = await Promise.all([
    sb.from('site_settings').select('*').eq('id',1).maybeSingle(), sb.from('admins').select('*').order('created_at',{ascending:true}), sb.from('members').select('*').order('created_at',{ascending:true}), sb.from('works').select('*').order('created_at',{ascending:true})
  ]); site={...fallback,...(s||{})}; admins=a||[];members=m||[];works=w||[];render();
  openModal(`<div class="form admin-dash"><div class="dash-head"><div><p class="eyebrow">PRIVATE DASHBOARD</p><h2>BDH Admin Panel</h2><p class="hint">Global data: changes are saved to Supabase and become visible to every visitor.</p></div><button class="danger" id="logoutBtn">Log Out</button></div><div class="tabs"><button class="tab active" data-tab="website">Website</button><button class="tab" data-tab="admins">Admins</button><button class="tab" data-tab="members">Members</button><button class="tab" data-tab="works">Works</button><button class="tab" data-tab="preview">👁 Visitor Preview</button></div><div id="dashContent"></div></div>`);
  showDashTab('website');
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');showDashTab(b.dataset.tab)});
  $('#logoutBtn').onclick=async()=>{await sb.auth.signOut();session=null;isAdmin=false;closeModal();};
}
function showDashTab(tab){const c=$('#dashContent'); if(tab==='website')c.innerHTML=websiteEditor(); if(tab==='admins')c.innerHTML=adminsEditor(); if(tab==='members')c.innerHTML=membersEditor(); if(tab==='works')c.innerHTML=worksEditor(); if(tab==='preview'){closeModal();location.hash='#home';window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>alert('Visitor Preview: close the Admin Panel and use the public page. The public site is exactly what visitors see.'),100)}}
function websiteEditor(){return `<div><label>Website tagline</label><input id="setTag" value="${esc(site.tagline)}"><label>BDH Facebook</label><input id="setFb" value="${esc(site.facebook)}"><label>BDH Logo</label><div class="upload"><input id="logoFile" type="file" accept="image/png,image/jpeg,image/webp"><span class="hint">Upload a logo to Supabase Storage.</span></div><input id="setLogo" value="${esc(site.logo_url)}"><button onclick="saveWebsite()">Save Website Settings</button><hr><p class="hint">Current logo preview</p>${pic(site.logo_url,'BDH logo')}</div>`}
function adminsEditor(){return `<div class="list-editor">${admins.map((a,i)=>`<div class="editrow"><div><b>${esc(a.name)}</b><div class="hint">${esc(a.role)}</div></div><div><button onclick="editAdmin(${i})">Edit</button>${admins.length>1?`<button class="danger" onclick="deleteAdmin(${i})">Delete</button>`:''}</div></div>`).join('')}</div>`}
function membersEditor(){return `<div class="list-editor">${members.map((m,i)=>`<div class="editrow"><div><b>${esc(m.name)}</b><div class="hint">${esc(m.role)}</div></div><div><button onclick="editMember(${i})">Edit</button><button class="danger" onclick="deleteMember(${i})">Delete</button></div></div>`).join('')}<button onclick="addMember()">＋ Add Member</button></div>`}
function worksEditor(){return `<div class="list-editor">${works.map((w,i)=>`<div class="editrow"><div><b>${esc(w.title)}</b><div class="hint">${esc(w.type)}</div></div><div><button onclick="editWork(${i})">Edit</button><button class="danger" onclick="deleteWork(${i})">Delete</button></div></div>`).join('')}<button onclick="addWork()">＋ Add Work</button></div>`}
async function saveWebsite(){let logo=$('#setLogo').value.trim();const f=$('#logoFile').files[0];try{if(f)logo=await uploadImage(f);const payload={id:1,tagline:$('#setTag').value.trim(),facebook:$('#setFb').value.trim(),logo_url:logo||fallback.logo_url,updated_at:new Date().toISOString()};const {error}=await sb.from('site_settings').upsert(payload);if(error)throw error;await loadPublic();await adminPanel()}catch(e){alert(e.message)}}
function editAdmin(i){const a=admins[i];openModal(`<div class="form"><h2>Edit Admin</h2>${adminEditFields(a,i)}</div>`)}
function adminEditFields(a,i){return `<label>Name</label><input id="an" value="${esc(a.name)}"><label>Role</label><input id="ar" value="${esc(a.role)}"><label>Bio</label><textarea id="ab">${esc(a.bio)}</textarea><label>Photo URL</label><input id="ap" value="${esc(a.photo_url)}"><label>Facebook URL</label><input id="af" value="${esc(a.facebook)}"><label>Instagram URL</label><input id="ai" value="${esc(a.instagram)}"><label>Upload photo</label><input id="apFile" type="file" accept="image/png,image/jpeg,image/webp"><button onclick="saveAdmin(${i})">Save Admin</button>`}
async function saveAdmin(i){try{let photo=$('#ap').value.trim();if($('#apFile').files[0])photo=await uploadImage($('#apFile').files[0]);const {error}=await sb.from('admins').update({name:$('#an').value.trim(),role:$('#ar').value.trim(),bio:$('#ab').value.trim(),photo_url:photo,facebook:$('#af').value.trim(),instagram:$('#ai').value.trim()}).eq('id',admins[i].id);if(error)throw error;await loadPublic();await adminPanel()}catch(e){alert(e.message)}}
async function deleteAdmin(i){if(admins[i].id===session.user.id){alert('You cannot delete the currently logged-in admin from this screen.');return}if(confirm('Delete this admin profile? Their Supabase login will remain unless you remove it from Authentication.')){const {error}=await sb.from('admins').delete().eq('id',admins[i].id);if(error)alert(error.message);else{await loadPublic();await adminPanel()}}}
function editMember(i){const m=members[i];openModal(`<div class="form"><h2>Edit Member</h2><label>Name</label><input id="mn" value="${esc(m.name)}"><label>Role</label><input id="mr" value="${esc(m.role)}"><label>Bio</label><textarea id="mb">${esc(m.bio)}</textarea><label>Photo URL</label><input id="mp" value="${esc(m.photo_url)}"><label>Facebook URL</label><input id="mf" value="${esc(m.facebook)}"><label>Instagram URL</label><input id="mi" value="${esc(m.instagram)}"><label>Video URLs (one per line)</label><textarea id="mv">${esc((m.videos||[]).join('\n'))}</textarea><label>Upload photo</label><input id="mpFile" type="file" accept="image/png,image/jpeg,image/webp"><button onclick="saveMember(${i})">Save Member</button></div>`)}
async function saveMember(i){try{let photo=$('#mp').value.trim();if($('#mpFile').files[0])photo=await uploadImage($('#mpFile').files[0]);const {error}=await sb.from('members').update({name:$('#mn').value.trim(),role:$('#mr').value.trim(),bio:$('#mb').value.trim(),photo_url:photo,facebook:$('#mf').value.trim(),instagram:$('#mi').value.trim(),videos:$('#mv').value.split('\n').map(x=>x.trim()).filter(Boolean)}).eq('id',members[i].id);if(error)throw error;await loadPublic();await adminPanel()}catch(e){alert(e.message)}}
async function addMember(){const {error}=await sb.from('members').insert({name:'New Member',role:'Voice Artist',bio:'',photo_url:'',facebook:'',instagram:'',videos:[]});if(error)alert(error.message);else{await loadPublic();await adminPanel()}}
async function deleteMember(i){if(confirm('Delete this member?')){const {error}=await sb.from('members').delete().eq('id',members[i].id);if(error)alert(error.message);else{await loadPublic();await adminPanel()}}}
function editWork(i){const w=works[i];openModal(`<div class="form"><h2>Edit Work</h2><label>Title</label><input id="wt" value="${esc(w.title)}"><label>Type</label><input id="wty" value="${esc(w.type)}"><label>Video / Project URL</label><input id="wu" value="${esc(w.url)}"><button onclick="saveWork(${i})">Save Work</button></div>`)}
async function saveWork(i){const {error}=await sb.from('works').update({title:$('#wt').value.trim(),type:$('#wty').value.trim(),url:$('#wu').value.trim()}).eq('id',works[i].id);if(error)alert(error.message);else{await loadPublic();await adminPanel()}}
async function addWork(){const {error}=await sb.from('works').insert({title:'New Project',type:'Anime • Bengali Fan Dub',url:''});if(error)alert(error.message);else{await loadPublic();await adminPanel()}}
async function deleteWork(i){if(confirm('Delete this work?')){const {error}=await sb.from('works').delete().eq('id',works[i].id);if(error)alert(error.message);else{await loadPublic();await adminPanel()}}}

async function boot(){ $('#year').textContent=new Date().getFullYear(); $('#adminBtn').onclick=openAdmin; if(!SUPABASE_READY){render();return;} const {data}=await sb.auth.getSession();session=data.session; sb.auth.onAuthStateChange((_event,s)=>{session=s}); await loadPublic(); }
boot();
