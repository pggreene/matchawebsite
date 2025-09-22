/* script.js
   Kōdō Incense updates:
   - languages (en/ja/zh)
   - cart persistence (localStorage)
   - add-to-cart buttons
   - account creation / demo verification + unique 10% discount code
   - profile dropdown hover stability (wider hover zone)
   - anchor offset centering
   - Formspree contact submission
*/

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // storage keys
  const USERS_KEY = "kodo_users_v2";
  const CURRENT_KEY = "kodo_current_v2";

  function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; } }
  function saveUsers(obj) { localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }
  function getCurrentEmail() { try { return localStorage.getItem(CURRENT_KEY); } catch { return null; } }
  function setCurrentEmail(e) { if (e) localStorage.setItem(CURRENT_KEY, e); else localStorage.removeItem(CURRENT_KEY); }
  function cartKeyFor(email) { return `kodo_cart_${email}`; }
  function getCart(email) { try { return JSON.parse(localStorage.getItem(cartKeyFor(email))) || []; } catch { return []; } }
  function saveCart(email, cart) { localStorage.setItem(cartKeyFor(email), JSON.stringify(cart || [])); }

  async function hashPassword(str) {
    const enc = new TextEncoder();
    const buf = enc.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // DOM elements
  const header = $("header");
  const topNav = $(".top-nav");
  const hamburger = $(".hamburger");
  const siteMenu = $(".site-menu");

  const profileWrap = $(".profile-wrap");
  const profileLabel = $(".profile-label");
  const profileDropdown = $(".profile-dropdown");
  const profileModal = $("#profile-modal");
  const profileClose = $("#profile-close");
  const signinForm = $("#signin-form");
  const createForm = $("#create-form");
  const verifyArea = $("#verify-area");

  const cartBtns = $$(".icon-cart");
  const cartPanel = $("#cart-panel");
  const cartClose = $("#cart-close");
  const cartContents = $("#cart-contents");
  const checkoutDemo = $("#checkout-demo");

  const languageItems = $$(".lang-option");

  // translations (kept minimal; more keys present in HTML via data-key)
  const translations = {
    en: {
      "hero-title":"Kōdō Incense",
      "hero-text":"Traditional Japanese incense — crafted for ritual, calm, and presence.",
      "about-intro":"Our Story",
      "about-story1":"Kōdō (香道) Incense preserves a long Japanese tradition of refined fragrance. We partner with small artisans to create subtle blends using quality woods, resins, and herbs.",
      "about-story2":"Each product is made in small batches to emphasize restraint and presence — fragrance that invites reflection, not distraction.",
      "products-title":"Products",
      "product-sticks":"Incense Sticks",
      "product-sticks-desc":"Hand-blended stick incense for ritual and everyday moments.",
      "product-kits":"Kits",
      "product-kits-desc":"Starter kits with a selection of sticks and a small ceramic holder.",
      "product-holders":"Holdings & Holders",
      "product-holders-desc":"Ceramic and wooden holders crafted by artisans.",
      "contact-title":"Contact Us",
      "contact-text":"Questions, wholesale inquiries, or partnership requests — reach out below.",
      "contact-btn":"Email Us"
    },
    ja: {
      "hero-title":"香道",
      "hero-text":"伝統的な日本の香り――儀礼と静けさのために作られた香品。",
      "about-intro":"私たちの物語",
      "about-story1":"香道は日本の香りの伝統を守り、職人と協力して木、樹脂、草花を用いた繊細なブレンドを作ります。",
      "about-story2":"少量生産により、注意深い香りで心を整えることを目指しています。",
      "products-title":"商品",
      "product-sticks":"線香（スティック）",
      "product-sticks-desc":"儀式や日常に使える手作りスティック。",
      "product-kits":"キット",
      "product-kits-desc":"複数のスティックと小さな陶器を含む入門セット。",
      "product-holders":"香立て",
      "product-holders-desc":"職人作の陶器や木製の香立て。",
      "contact-title":"お問い合わせ",
      "contact-text":"ご質問、卸売、またはパートナーシップについては以下からご連絡ください。",
      "contact-btn":"メールを送る"
    },
    zh: {
      "hero-title":"香道",
      "hero-text":"传统日本香 —— 为仪式、平静与当下而制。",
      "about-intro":"我们的故事",
      "about-story1":"香道与匠人合作，使用优选木材、树脂与草本，手工调制细腻香品。",
      "about-story2":"我们坚持小批量制作，旨在带来沉静与反思的香气体验。",
      "products-title":"产品",
      "product-sticks":"线香（Sticks）",
      "product-sticks-desc":"适合仪式与日常的手工线香。",
      "product-kits":"套装",
      "product-kits-desc":"包含数款线香与陶器的小型入门套装。",
      "product-holders":"香座",
      "product-holders-desc":"陶瓷与木制匠人香座。",
      "contact-title":"联系我们",
      "contact-text":"如有问题、批发或合作，请通过下方联系。",
      "contact-btn":"发送邮件"
    }
  };

  // apply language to all data-key elements, with fade
  function applyLanguage(lang) {
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
      try { localStorage.setItem("kodo_lang", lang); } catch (e) {}
    }, 260);
  }

  // language items click
  languageItems.forEach(li => {
    li.addEventListener("click", () => {
      const lang = li.dataset.lang;
      if (!lang) return;
      applyLanguage(lang);
      if (siteMenu) siteMenu.classList.remove("open");
    });
  });

  // load saved language
  const savedLang = (function(){ try { return localStorage.getItem("kodo_lang") || "en"; } catch { return "en"; } })();
  applyLanguage(savedLang);

  // stabilize dropdowns: products, languages, profile
  (function stabilize() {
    const parents = Array.from(document.querySelectorAll(".nav-item, .profile-wrap"));
    parents.forEach(parent => {
      const submenu = parent.querySelector(".products-submenu, .languages-submenu, .profile-dropdown");
      if (!submenu) return;
      let timer = null;
      // generous hover area: keep submenu open while mouse is near
      function open() { clearTimeout(timer); submenu.classList.add("visible-hover"); submenu.style.display = "block"; submenu.setAttribute("aria-hidden","false"); }
      function close() { clearTimeout(timer); timer = setTimeout(()=>{ submenu.classList.remove("visible-hover"); submenu.style.display = ""; submenu.setAttribute("aria-hidden","true"); }, 260); }
      parent.addEventListener("mouseenter", open);
      parent.addEventListener("mouseleave", close);
      submenu.addEventListener("mouseenter", open);
      submenu.addEventListener("mouseleave", close);
    });
  })();

  // anchor offset / centering for nav links to sections on same page
  (function anchorFix() {
    document.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[href^='#']");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      ev.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const navH = topNav ? topNav.offsetHeight : 0;
      const elRect = el.getBoundingClientRect();
      const elTop = window.scrollY + elRect.top;
      const elHeight = elRect.height;
      const viewH = window.innerHeight;
      let target;
      if (elHeight + headerH + navH + 80 < viewH) {
        target = Math.max(0, elTop - Math.round((viewH - elHeight)/2));
      } else {
        target = Math.max(0, elTop - headerH - navH - 28);
      }
      window.scrollTo({ top: target, behavior: "smooth" });
    });
  })();

  // profile modal / forms
  function clearProfileForms() {
    if (signinForm) signinForm.reset();
    if (createForm) createForm.reset();
    if (verifyArea) verifyArea.innerHTML = "";
    const msg = $("#profile-msg"); if (msg) { msg.textContent = ""; msg.style.color = ""; }
  }
  function openProfileModal() { if (profileModal) { clearProfileForms(); profileModal.classList.add("open"); profileModal.setAttribute("aria-hidden","false"); } }
  function closeProfileModal() { if (profileModal) { profileModal.classList.remove("open"); profileModal.setAttribute("aria-hidden","true"); clearProfileForms(); } }
  if (profileClose) profileClose.addEventListener("click", closeProfileModal);

  if (profileModal) {
    const obs = new MutationObserver((m) => {
      m.forEach(r => { if (r.attributeName === "class" && profileModal.classList.contains("open")) clearProfileForms(); });
    });
    obs.observe(profileModal, { attributes: true });
  }

  // demo verification code + discount generator
  function generateCode() { return (Math.floor(100000 + Math.random()*900000)).toString(); }
  function generateDiscountCode() {
    const suffix = Math.random().toString(36).substring(2,8).toUpperCase();
    return `KODO10-${suffix}`;
  }

  async function createAccount({ name, email, password }) {
    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) return { ok:false, err: "Account already exists." };
    const ph = await hashPassword(password);
    const vcode = generateCode();
    const discount = generateDiscountCode();
    users[key] = { name, email: key, passwordHash: ph, verified:false, verificationCode:vcode, discountCode: discount, createdAt:Date.now() };
    saveUsers(users);
    showVerificationSentUI(key, vcode, discount);
    return { ok:true, user:users[key] };
  }

  async function signIn({ email, password }) {
    const users = getUsers();
    const u = users[email.toLowerCase()];
    if (!u) return { ok:false, err: "No account for that email." };
    const h = await hashPassword(password);
    if (h !== u.passwordHash) return { ok:false, err: "Incorrect password." };
    if (!u.verified) return { ok:false, err: "Email not verified. Please verify first." };
    setCurrentEmail(u.email);
    updateProfileUI();
    return { ok:true, user:u };
  }

  function signOut() { setCurrentEmail(null); updateProfileUI(); }

  // show verification UI and display demo discount
  function showVerificationSentUI(email, vcode, discount) {
    const msg = $("#profile-msg");
    if (msg) {
      msg.style.color = "#2d6a2d";
      msg.innerHTML = `Demo verification code generated for <strong>${escapeHtml(email)}</strong>.<br><em>Code: <strong>${escapeHtml(vcode)}</strong></em><br><small>Your demo 10% discount code: <strong>${escapeHtml(discount)}</strong></small>`;
    }
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
      const rbtn = $("#resend-code");
      if (vsub) vsub.addEventListener("click", () => {
        const val = vinput ? vinput.value.trim() : "";
        const m = $("#profile-msg");
        if (!val) { if (m) { m.style.color="#c0392b"; m.textContent="Please enter the code."; } return; }
        const users = getUsers();
        const u = users[email.toLowerCase()];
        if (u && u.verificationCode === val) {
          u.verified = true; delete u.verificationCode; saveUsers(users);
          if (m) { m.style.color="var(--dark-green)"; m.textContent="Email verified — signing you in (demo)."; }
          setTimeout(()=>{ setCurrentEmail(u.email); updateProfileUI(); closeProfileModal(); }, 700);
        } else { if (m) { m.style.color="#c0392b"; m.textContent="Invalid code."; } }
      });
      if (rbtn) rbtn.addEventListener("click", () => {
        const users = getUsers();
        if (users[email.toLowerCase()]) {
          const newCode = generateCode(); users[email.toLowerCase()].verificationCode = newCode; saveUsers(users);
          const m = $("#profile-msg"); if (m) { m.style.color="#2d6a2d"; m.innerHTML = `New demo code: <strong>${escapeHtml(newCode)}</strong>`; }
        }
      });
    }
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  if (createForm) {
    createForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const name = createForm.querySelector('[name="name"]').value.trim();
      const email = createForm.querySelector('[name="email"]').value.trim();
      const pw = createForm.querySelector('[name="password"]').value;
      const msg = $("#profile-msg");
      if (!name||!email||!pw) { if (msg) { msg.style.color="#c0392b"; msg.textContent="Please fill all fields."; } return; }
      const res = await createAccount({ name, email, password: pw });
      if (!res.ok) { if (msg) { msg.style.color="#c0392b"; msg.textContent = res.err; } return; }
    });
  }
  if (signinForm) {
    signinForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const email = signinForm.querySelector('[name="email"]').value.trim();
      const pw = signinForm.querySelector('[name="password"]').value;
      const msg = $("#profile-msg");
      if (!email||!pw) { if (msg) { msg.style.color="#c0392b"; msg.textContent="Please fill both fields."; } return; }
      const res = await signIn({ email, password: pw });
      if (!res.ok) {
        if (res.err && res.err.includes("not verified")) {
          if (msg) { msg.style.color="#c0392b"; msg.textContent = res.err; }
          const users = getUsers(); const u = users[email.toLowerCase()];
          if (u && u.verificationCode) showVerificationSentUI(email, u.verificationCode, u.discountCode);
          return;
        }
        if (msg) { msg.style.color="#c0392b"; msg.textContent = res.err; }
        return;
      }
      if (msg) { msg.style.color="var(--dark-green)"; msg.textContent="Signed in."; }
      setTimeout(()=>{ closeProfileModal(); }, 500);
    });
  }

  // profile UI
  function updateProfileUI() {
    const email = getCurrentEmail();
    const users = getUsers();
    const user = email ? users[email] : null;
    if (profileLabel) {
      profileLabel.textContent = user ? (user.name || user.email.split("@")[0]) : "Account";
    }
    if (profileDropdown) {
      if (user) {
        profileDropdown.innerHTML = `<div class="profile-welcome">Signed in as <strong>${escapeHtml(user.name || user.email)}</strong></div>
          <div style="margin-top:8px"><strong>Your discount:</strong> <span class="discount-badge">${escapeHtml(user.discountCode || "KODO10-XXXX")}</span></div>
          <div style="margin-top:10px"><button id="signout-btn" class="profile-action">Sign out</button></div>`;
        const s = $("#signout-btn"); if (s) s.addEventListener("click", () => { signOut(); });
      } else {
        profileDropdown.innerHTML = `<div class="profile-welcome">Not signed in</div>
          <div style="margin-top:8px"><button id="open-signin" class="profile-action">Sign in / Create</button></div>`;
        const o = $("#open-signin"); if (o) o.addEventListener("click", () => openProfileModal());
      }
    }
    // cart badge update
    const badge = document.querySelector(".icon-badge");
    if (badge) {
      const cur = getCurrentEmail();
      const count = cur ? getCart(cur).length : 0;
      if (count > 0) { badge.style.display = "flex"; badge.textContent = count; } else { badge.style.display = "none"; }
    }
  }

  // profile hover / mobile click
  if (profileWrap) {
    profileWrap.addEventListener("mouseenter", () => { if (profileDropdown) profileDropdown.classList.add("visible-hover"); });
    profileWrap.addEventListener("mouseleave", () => { if (profileDropdown) profileDropdown.classList.remove("visible-hover"); });
    profileWrap.addEventListener("click", () => { if (window.innerWidth < 900 && profileDropdown) profileDropdown.classList.toggle("visible-hover"); });
  }

  // CART: add-to-cart handlers
  function addToCart(sku, name, price, qty=1) {
    const email = getCurrentEmail();
    if (!email) {
      // prompt to create account (demo) — open modal
      openProfileModal();
      const msg = $("#profile-msg"); if (msg) { msg.style.color="#c0392b"; msg.textContent="Please create an account or sign in to save cart items (demo)."; }
      return;
    }
    const cart = getCart(email);
    const existing = cart.find(i => i.sku === sku);
    if (existing) existing.qty += qty;
    else cart.push({ sku, name, price: Number(price), qty });
    saveCart(email, cart);
    renderCart();
    updateProfileUI();
  }

  // bind add-to-cart buttons (on this page and subpages)
  function bindAddButtons() {
    $$(".add-to-cart").forEach(btn => {
      btn.removeEventListener("click", onAddClick);
      btn.addEventListener("click", onAddClick);
    });
  }
  function onAddClick(e) {
    const b = e.currentTarget;
    const sku = b.dataset.sku;
    const name = b.dataset.name;
    const price = b.dataset.price;
    addToCart(sku, name, price, 1);
  }

  // cart panel open/close & render
  function openCart() { if (cartPanel) { cartPanel.classList.add("open"); renderCart(); } }
  function closeCart() { if (cartPanel) cartPanel.classList.remove("open"); }
  cartBtns.forEach(b => b.addEventListener("click", openCart));
  if (cartClose) cartClose.addEventListener("click", closeCart);

  function renderCart() {
    const cur = getCurrentEmail();
    if (!cartContents) return;
    const items = cur ? getCart(cur) : [];
    if (!items || items.length === 0) cartContents.innerHTML = `<div class="cart-empty">Your cart is empty.</div>`;
    else {
      cartContents.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
        ${items.map((i, idx) => `<div style="display:flex;justify-content:space-between;align-items:center;">
          <div><strong>${escapeHtml(i.name)}</strong><div style="font-size:.9rem;color:#666">Qty: ${escapeHtml(String(i.qty))} — $${(i.price*i.qty).toFixed(2)}</div></div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button data-idx="${idx}" class="btn cart-remove">Remove</button>
            <button data-idx="${idx}" class="btn cart-decr">-</button>
            <button data-idx="${idx}" class="btn cart-incr">+</button>
          </div>
        </div>`).join("")}
      </div>`;
      // bind remove/incr/decr
      $$(".cart-remove").forEach(b => b.addEventListener("click", (ev)=> {
        const idx = Number(ev.currentTarget.dataset.idx);
        const cart = getCart(cur);
        cart.splice(idx,1);
        saveCart(cur, cart);
        renderCart();
        updateProfileUI();
      }));
      $$(".cart-decr").forEach(b => b.addEventListener("click", (ev)=> {
        const idx = Number(ev.currentTarget.dataset.idx);
        const cart = getCart(cur);
        if (cart[idx].qty>1) cart[idx].qty--;
        else cart.splice(idx,1);
        saveCart(cur, cart);
        renderCart();
        updateProfileUI();
      }));
      $$(".cart-incr").forEach(b => b.addEventListener("click", (ev)=> {
        const idx = Number(ev.currentTarget.dataset.idx);
        const cart = getCart(cur);
        cart[idx].qty++;
        saveCart(cur, cart);
        renderCart();
        updateProfileUI();
      }));
    }
  }

  if (checkoutDemo) {
    checkoutDemo.addEventListener("click", () => {
      const cur = getCurrentEmail();
      if (!cur) { openProfileModal(); const msg = $("#profile-msg"); if (msg) { msg.style.color="#c0392b"; msg.textContent="Please sign in or create an account to checkout (demo)."; } return; }
      const cart = getCart(cur);
      if (!cart || cart.length===0) { alert("Your cart is empty."); return; }
      // demo checkout: show summary and clear cart
      const total = cart.reduce((s,i)=> s + (i.price*i.qty), 0).toFixed(2);
      const users = getUsers();
      const user = users[cur] || {};
      const discount = user.discountCode ? 0.10 : 0;
      const discounted = (total * (1 - discount)).toFixed(2);
      alert(`Demo checkout\nItems: ${cart.length}\nSubtotal: $${total}\nDiscount: ${discount*100}%\nTotal: $${discounted}\n(orders not actually sent in demo)`);
      // clear cart
      saveCart(cur, []);
      renderCart();
      updateProfileUI();
    });
  }

  // contact form (Formspree)
  const contactForm = $("#contact-form");
  const formResponse = $("#form-response");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (formResponse) formResponse.textContent = "";
      try {
        const res = await fetch(contactForm.action, { method: "POST", body: new FormData(contactForm), headers: { "Accept": "application/json" } });
        if (res.ok) {
          if (formResponse) { formResponse.style.color = "var(--dark-green)"; formResponse.textContent = "✅ Thank you — your message was sent."; }
          contactForm.reset();
        } else {
          if (formResponse) { formResponse.style.color = "#c0392b"; formResponse.textContent = "❌ Oops — message not sent. Please try again."; }
        }
      } catch (err) {
        if (formResponse) { formResponse.style.color = "#c0392b"; formResponse.textContent = "❌ Network error — please try later."; }
        console.error(err);
      }
    });
  }

  // fade-on-scroll
  (function fadeOnScroll() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) en.target.classList.add("visible"); });
    }, { threshold: 0.16 });
    document.querySelectorAll(".fade-on-scroll, .about p, .product-card").forEach(el => { if (el) obs.observe(el); });
  })();

  // top fade on scroll (logo excluded)
  (function topFade() {
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

  // ensure top-nav icons not duplicated
  (function cleanTopNav() {
    const topIcons = document.querySelectorAll(".top-nav .icon-btn, .top-nav .profile-wrap");
    topIcons.forEach(el => el.parentNode && el.parentNode.removeChild(el));
  })();

  // hamburger mobile open/close
  if (hamburger && siteMenu) {
    hamburger.addEventListener("click", (e) => { e.stopPropagation(); siteMenu.classList.toggle("open"); });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".site-menu") && !e.target.closest(".hamburger")) siteMenu.classList.remove("open");
    });
  }

  // open profile modal from profile dropdown
  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("#open-signin, .profile-action, .profile-label");
    if (openBtn && e.target.id !== 'signout-btn') openProfileModal();
  });

  // bind add buttons initially + on dynamic content
  bindAddButtons();

  // refresh UI
  updateProfileUI();

  // expose for debugging (optional)
  window._kodo = { getUsers, saveUsers, getCurrentEmail, setCurrentEmail, getCart, saveCart };

});
