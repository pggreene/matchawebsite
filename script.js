/* script.js
   - localStorage demo accounts with email "verification" code (simulated)
   - profile UI: show name in green header when signed in; hover to show sign out
   - clear forms on open/close
   - languages (click on mobile, hover on desktop) + fade change
   - improved dropdown hover logic (timers) to prevent disappearing due to tiny gap
   - anchor scrolling with centering/offset
   - cart panel (placeholder) tied to current user
   - contact form (Formspree) unchanged
*/

/* ===================== helpers ===================== */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const safe = (sel) => document.querySelector(sel);

  // simple SHA-256 hash (returns hex) used for storing password hash in demo
  async function hashPassword(str){
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ====== localStorage keys & helpers (demo account store) ====== */
  const USERS_KEY = "ogawa_users_v2";
  const CURRENT_KEY = "ogawa_current_v2";

  function getUsers(){
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveUsers(obj){
    localStorage.setItem(USERS_KEY, JSON.stringify(obj));
  }
  function getCurrentEmail(){ try { return localStorage.getItem(CURRENT_KEY); } catch { return null; } }
  function setCurrentEmail(e){ if(e) localStorage.setItem(CURRENT_KEY, e); else localStorage.removeItem(CURRENT_KEY); }
  function cartKeyFor(email){ return `ogawa_cart_${email}`; }
  function getCart(email){ try { return JSON.parse(localStorage.getItem(cartKeyFor(email)))||[] } catch { return []; } }
  function saveCart(email, cart){ localStorage.setItem(cartKeyFor(email), JSON.stringify(cart||[])); }

  /* ====== UI elements ====== */
  const header = $("header");
  const topNav = $(".top-nav");
  const hamburger = $(".hamburger");
  const siteMenu = $(".site-menu");

  // header icons kept only in the green header (not in the white top-nav)
  const profileWrap = $(".profile-wrap");       // green header
  const profileLabel = $(".profile-label");
  const profileDropdown = $(".profile-dropdown");
  const profileBtn = $(".icon-profile");        // only used on mobile slide-in
  const profileModal = $("#profile-modal");
  const profileClose = $("#profile-close");
  const signinForm = $("#signin-form");
  const createForm = $("#create-form");

  const cartBtn = $(".icon-cart");
  const cartPanel = $("#cart-panel");
  const cartClose = $("#cart-close");
  const cartContents = $("#cart-contents");

  const languageItems = Array.from(document.querySelectorAll(".lang-option"));
  const languagesSubmenus = Array.from(document.querySelectorAll(".languages-submenu, #languages-submenu"));

  /* ================== languages + translations ================== */
  const translations = {
    en: { "hero-title":"Ogawa Matcha", "hero-text":"Authentic Japanese matcha, sourced from Kyoto’s finest tea fields.","about-intro":"Our Story","about-story1":"Ogawa Matcha began as a small passion project among friends who grew up near Kyoto’s terraced tea fields.","about-story2":"Today, we work with farmers who use time-honored cultivation and stone-grinding techniques to preserve flavor and color.","about-story3":"From seed to cup — a mindful, careful journey intended to bring quiet luxury to your day.","products-title":"Products","product1-title":"Matcha","product1-text":"Ceremonial + culinary matcha — vibrant green, rich umami.","product2-title":"Tea Kits","product2-text":"Complete kits including chawan, chasen, and chashaku — ready for home ritual.","product3-title":"Upcoming Events","product3-text":"Tastings, workshops and seasonal tea ceremonies — RSVP when available.","contact-title":"Contact Us","contact-text":"Have any questions? Reach out anytime.","contact-btn":"Email Us",
            "matcha-page-title":"Our Matcha","matcha-intro":"Three signature grades to match your mood.","matcha1-title":"Tranquil Blend","matcha1-text":"Smooth and lightly sweet — perfect for evening relaxation.","matcha2-title":"Energy Boost","matcha2-text":"Bright and bold — an uplifting morning ritual.","matcha3-title":"Clarity Focus","matcha3-text":"Balanced umami for clear mind and focused work.","kit-page-title":"Matcha Tea Kits","kit-intro":"Everything you need to prepare premium matcha at home.","kit1-title":"Chawan (Tea Bowl)","kit1-text":"Handcrafted bowls shaped for whisking and sipping.","kit2-title":"Chasen (Bamboo Whisk)","kit2-text":"A bamboo whisk that creates a smooth, frothy texture.","kit3-title":"Chashaku (Bamboo Scoop)","kit3-text":"Traditional scoop for measuring the perfect portion.","events-page-title":"Upcoming Events","events-intro":"Join tastings, workshops, and seasonal tea ceremonies.","event1-title":"Matcha Tasting","event1-text":"Guided tasting of ceremonial grades.","event2-title":"Tea Ceremony Workshop","event2-text":"Learn the basic steps and etiquette.","event3-title":"Blending Class","event3-text":"Create your own culinary matcha blends." },
    ja: { /* same as previous ja block (omitted for brevity) */ },
    zh: { /* same as previous zh block (omitted for brevity) */ },
    es: { /* same as previous es block (omitted for brevity) */ }
  };

  // NOTE: to keep the file compact in this reply I shortened the full ja/zh/es objects above.
  // In your actual repo please keep the full translation objects you already had.
  // If you're copying this file: keep the earlier big translations blocks for ja/zh/es exactly as before.

  function applyLanguage(lang){
    const els = Array.from(document.querySelectorAll("[data-key]"));
    if (!els.length) return;
    els.forEach(el => { el.style.transition = "opacity .26s ease"; el.style.opacity = "0"; });
    setTimeout(() => {
      els.forEach(el => {
        const key = el.getAttribute("data-key");
        if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
        else if (translations.en[key]) el.textContent = translations.en[key];
      });
      els.forEach(el => el.style.opacity = "1");
      try { localStorage.setItem("ogawa_lang", lang); } catch (e) {}
    }, 280);
  }

  // wire language items (desktop hover opens submenu via CSS; clicking on an item sets language)
  languageItems.forEach(li => {
    li.addEventListener("click", (e) => {
      const lang = li.dataset.lang;
      applyLanguage(lang);
      if (siteMenu) siteMenu.classList.remove("open");
    });
  });

  // load language
  const savedLang = (function(){ try { return localStorage.getItem("ogawa_lang") || "en"; } catch { return "en"; } })();
  applyLanguage(savedLang);

  /* ================== dropdown hover stability fix ==================
     Idea: keep submenu open when mouse is inside either the parent nav-item or submenu.
     We also add a small hide-delay to avoid flicker when moving quickly.
  ================================================================ */
  (function stabilizeDropdowns(){
    // find nav items that have a submenu
    const navItems = Array.from(document.querySelectorAll(".nav-item, .has-submenu"));
    navItems.forEach(item => {
      const submenu = item.querySelector(".languages-submenu, .submenu");
      if (!submenu) return;
      let hideTimer = null;
      const show = () => { clearTimeout(hideTimer); submenu.classList.add("visible-hover"); submenu.style.display = "block"; };
      const hide = () => { clearTimeout(hideTimer); hideTimer = setTimeout(()=>{ submenu.classList.remove("visible-hover"); submenu.style.display = ""; }, 180); };
      item.addEventListener("mouseenter", show);
      item.addEventListener("mouseleave", hide);
      submenu.addEventListener("mouseenter", show);
      submenu.addEventListener("mouseleave", hide);
    });
  })();

  /* ================== Anchor scrolling with better offset/centering ================== */
  (function anchorScrollOffset(){
    document.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[href^='#']");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return; // let default if not found
      ev.preventDefault();

      const headerH = header ? header.offsetHeight : 0;
      const navH = topNav ? topNav.offsetHeight : 0;
      const elRect = el.getBoundingClientRect();
      const elHeight = elRect.height;
      const viewH = window.innerHeight;
      const elTop = window.scrollY + elRect.top;

      let target;
      if (elHeight + headerH + navH + 80 < viewH) {
        // center the whole element if possible
        target = Math.max(0, elTop - Math.round((viewH - elHeight)/2));
      } else {
        // otherwise put it nicely below header + nav
        target = Math.max(0, elTop - headerH - navH - 28);
      }

      window.scrollTo({ top: target, behavior: "smooth" });
    });
  })();

  /* ================== modal form clearing & profile modal open/close ================== */
  function clearProfileForms(){
    if (signinForm) signinForm.reset();
    if (createForm) createForm.reset();
    const msg = $("#profile-msg"); if (msg) { msg.textContent = ""; msg.style.color = ""; }
  }
  function openProfileModal(){ if (profileModal) { clearProfileForms(); profileModal.classList.add("open"); profileModal.setAttribute("aria-hidden","false"); } }
  function closeProfileModal(){ if (profileModal) { profileModal.classList.remove("open"); profileModal.setAttribute("aria-hidden","true"); clearProfileForms(); } }
  if (profileBtn) profileBtn.addEventListener("click", openProfileModal);
  if (profileClose) profileClose.addEventListener("click", closeProfileModal);

  // also allow opening the modal from the profile dropdown "Sign in / Create"
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.matches("#open-signin, .profile-action, .profile-open")) {
      openProfileModal();
    }
  });

  // clear forms every time the modal is opened via MutationObserver (defensive)
  if (profileModal) {
    const obs = new MutationObserver((m) => {
      m.forEach(rec => {
        if (rec.attributeName === "class") {
          if (profileModal.classList.contains("open")) clearProfileForms();
        }
      });
    });
    obs.observe(profileModal, { attributes: true });
  }

  /* ================== account system (demo: verification code stored locally) ================== */
  function generateCode(){
    return Math.floor(100000 + Math.random()*900000).toString(); // 6-digit
  }

  async function createAccount({name, email, password}) {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) return { ok:false, err:"An account already exists for that email." };
    const pwHash = await hashPassword(password);
    const code = generateCode();
    users[key] = {
      name: name,
      email: key,
      passwordHash: pwHash,
      verified: false,
      verificationCode: code,
      createdAt: Date.now()
    };
    saveUsers(users);
    // "send" verification - demo only (see note below)
    showVerificationSentUI(key, code);
    return { ok:true, user: users[key] };
  }

  async function signIn({email, password}) {
    const users = getUsers();
    const u = users[email.toLowerCase()];
    if (!u) return { ok:false, err: "No account for that email." };
    const hash = await hashPassword(password);
    if (hash !== u.passwordHash) return { ok:false, err:"Incorrect password." };
    if (!u.verified) return { ok:false, err:"Email not verified. Please verify your email first." };
    setCurrentEmail(u.email);
    updateProfileUI();
    return { ok:true, user:u };
  }

  function signOut(){
    setCurrentEmail(null);
    updateProfileUI();
  }

  // Show verification-sent UI inside modal (demo). In production you should integrate a server/email provider.
  function showVerificationSentUI(email, code){
    // show a friendly message in modal and present a verification input
    const msg = $("#profile-msg");
    if (msg) {
      msg.style.color = "#2d6a2d";
      msg.innerHTML = `Verification code generated and (demo) "sent" to <strong>${escapeHtml(email)}</strong>.<br>
        <em>(Demo mode) Use this code to verify: <strong>${escapeHtml(code)}</strong></em>`;
    }
    // render verify input
    const verifyArea = $("#verify-area");
    if (verifyArea) {
      verifyArea.innerHTML = `
        <div style="margin-top:8px">
          <input id="verify-input" placeholder="Enter verification code" style="padding:8px;border-radius:6px;border:1px solid #ddd;width:60%">
          <button id="verify-submit" style="padding:8px;border-radius:6px;background:var(--dark-green);color:#fff;border:none;margin-left:6px">Verify</button>
          <button id="resend-code" style="padding:8px;border-radius:6px;border:1px solid #ddd;margin-left:6px;background:#fff">Resend</button>
        </div>
      `;
      const vsub = $("#verify-submit");
      const vinput = $("#verify-input");
      const resendBtn = $("#resend-code");
      if (vsub) vsub.addEventListener("click", () => {
        const val = vinput ? vinput.value.trim() : "";
        if (!val) { if (msg) { msg.style.color = "#c0392b"; msg.textContent = "Please enter the code."; } return; }
        const users = getUsers();
        const u = users[email.toLowerCase()];
        if (u && u.verificationCode === val) {
          u.verified = true;
          delete u.verificationCode;
          saveUsers(users);
          if (msg) { msg.style.color = "var(--dark-green)"; msg.textContent = "Email verified — you can now sign in."; }
          // auto sign in demo after verification
          setCurrentEmail(u.email);
          updateProfileUI();
          setTimeout(()=>{ closeProfileModal(); }, 800);
        } else {
          if (msg) { msg.style.color = "#c0392b"; msg.textContent = "Invalid code. Try again."; }
        }
      });
      if (resendBtn) resendBtn.addEventListener("click", () => {
        const users = getUsers();
        if (users[email.toLowerCase()]) {
          const newCode = generateCode();
          users[email.toLowerCase()].verificationCode = newCode;
          saveUsers(users);
          if (msg) { msg.style.color = "#2d6a2d"; msg.innerHTML = `New code generated and (demo) "sent" to <strong>${escapeHtml(email)}</strong>.<br><em>Code: <strong>${escapeHtml(newCode)}</strong></em>`; }
        }
      });
    }
  }

  // helper escaping
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // handle form submit: create / signin
  if (createForm) {
    createForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const name = createForm.querySelector('[name="name"]').value.trim();
      const email = createForm.querySelector('[name="email"]').value.trim();
      const pw = createForm.querySelector('[name="password"]').value;
      const msg = $("#profile-msg");
      if (!name||!email||!pw) { if (msg) { msg.style.color = "#c0392b"; msg.textContent = "Please fill all fields."; } return; }
      const res = await createAccount({name, email, password: pw});
      if (!res.ok) { if (msg) { msg.style.color = "#c0392b"; msg.textContent = res.err; } return; }
      // show verify area (demo)
      if ($("#verify-area")) $("#verify-area").innerHTML = ""; // prepare
      showVerificationSentUI(email, getUsers()[email.toLowerCase()].verificationCode);
    });
  }

  if (signinForm) {
    signinForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = signinForm.querySelector('[name="email"]').value.trim();
      const pw = signinForm.querySelector('[name="password"]').value;
      const msg = $("#profile-msg");
      if (!email||!pw) { if (msg) { msg.style.color = "#c0392b"; msg.textContent = "Please fill both fields."; } return; }
      const res = await signIn({email, password: pw});
      if (!res.ok) {
        if (res.err && res.err.includes("not verified")) {
          // show verify flow if not verified
          if (msg) msg.style.color = "#c0392b"; msg.textContent = res.err + " We can re-send a code (demo).";
          const users = getUsers();
          const u = users[email.toLowerCase()];
          if (u && u.verificationCode) showVerificationSentUI(email, u.verificationCode);
          return;
        }
        if (msg) { msg.style.color = "#c0392b"; msg.textContent = res.err; }
        return;
      }
      if (msg) { msg.style.color = "var(--dark-green)"; msg.textContent = "Signed in."; }
      // close modal shortly
      setTimeout(()=>{ closeProfileModal(); }, 500);
    });
  }

  /* ================== Profile UI state (show name in green header) ================== */
  function updateProfileUI(){
    const email = getCurrentEmail();
    const users = getUsers();
    const user = email ? users[email] : null;
    // profileLabel in header
    if (profileLabel) {
      if (user) profileLabel.textContent = user.name || user.email.split("@")[0];
      else profileLabel.textContent = "Account";
    }
    // profile dropdown content
    if (profileDropdown) {
      if (user) {
        profileDropdown.innerHTML = `<div class="profile-welcome">Signed in as <strong>${escapeHtml(user.name || user.email)}</strong></div>
          <button id="signout-btn" class="profile-action">Sign out</button>`;
        const signout = $("#signout-btn");
        if (signout) signout.addEventListener("click", () => { signOut(); });
      } else {
        profileDropdown.innerHTML = `<div class="profile-welcome">Not signed in</div>
          <button id="open-signin" class="profile-action">Sign in / Create</button>`;
        const open = $("#open-signin");
        if (open) open.addEventListener("click", () => openProfileModal());
      }
    }
    // update cart badge (count)
    try {
      const badge = document.querySelector(".icon-badge");
      if (badge) {
        const cur = getCurrentEmail();
        const count = cur ? getCart(cur).length : 0;
        if (count > 0) { badge.style.display = "flex"; badge.textContent = count; } else { badge.style.display = "none"; }
      }
    } catch(e){}
  }

  // profile dropdown hover (desktop) and click toggles (mobile)
  if (profileWrap) {
    profileWrap.addEventListener("mouseenter", () => { if (profileDropdown) profileDropdown.classList.add("visible"); });
    profileWrap.addEventListener("mouseleave", () => { if (profileDropdown) profileDropdown.classList.remove("visible"); });
    profileWrap.addEventListener("click", () => { if (window.innerWidth < 900 && profileDropdown) profileDropdown.classList.toggle("visible"); });
  }

  /* ================== CART Placeholder panel ================== */
  function openCart(){ if (cartPanel) { cartPanel.classList.add("open"); renderCart(); } }
  function closeCart(){ if (cartPanel) cartPanel.classList.remove("open"); }
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);

  function renderCart(){
    const cur = getCurrentEmail();
    if (!cartContents) return;
    const items = cur ? getCart(cur) : [];
    if (!items || items.length === 0) cartContents.innerHTML = `<div class="cart-empty">Your cart is empty.</div>`;
    else cartContents.innerHTML = `<div>${items.map(i=>`<div>${escapeHtml(i.name)} x${escapeHtml(String(i.qty))}</div>`).join("")}</div>`;
  }

  /* ================== Contact form (Formspree) (unchanged behavior) ================== */
  const contactForm = $("#contact-form");
  const formResponse = $("#form-response");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formResponse) formResponse.textContent = "";
      try {
        const res = await fetch(contactForm.action, { method:"POST", body: new FormData(contactForm), headers:{ 'Accept': 'application/json' } });
        if (res.ok) {
          if (formResponse) { formResponse.style.color = "var(--dark-green)"; formResponse.textContent = "✅ Thank you — your message was sent."; }
          contactForm.reset();
        } else {
          if (formResponse) { formResponse.style.color = "#c0392b"; formResponse.textContent = "❌ Oops — message not sent."; }
        }
      } catch (err) {
        if (formResponse) { formResponse.style.color = "#c0392b"; formResponse.textContent = "❌ Network error — try again later."; }
        console.error(err);
      }
    });
  }

  /* ================== fade-on-scroll (IntersectionObserver) ================== */
  (function fadeObserver(){
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) en.target.classList.add("visible"); });
    }, { threshold: 0.16 });
    document.querySelectorAll(".fade-on-scroll, .about p, .product-card").forEach(el => { if (el) obs.observe(el); });
  })();

  /* ================== top fade on scroll direction (hide-top) ================== */
  (function topFade(){
    let lastY = window.scrollY || 0;
    const DELTA = 12;
    window.addEventListener("scroll", () => {
      const cur = window.scrollY || 0;
      if (Math.abs(cur - lastY) < DELTA) return;
      if (cur > lastY && cur > 60) document.body.classList.add("hide-top");
      else document.body.classList.remove("hide-top");
      lastY = cur;
    });
  })();

  /* ================== init UI ================== */
  updateProfileUI();

  // remove profile/cart from top-nav (white) if present: keep only in green header
  (function cleanTopNav(){
    const topIcons = document.querySelectorAll(".top-nav .icon-btn, .top-nav .profile-wrap");
    topIcons.forEach(el => el.parentNode && el.parentNode.removeChild(el));
  })();

  /* ================== ensure modal inputs are cleared each time user opens profile modal ================== */
  // already done via clearProfileForms above & MutationObserver

  /* ================== End DOMContentLoaded ================== */
});
