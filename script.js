/* script.js - unified for index + subpages
   - menu open/close
   - language click-to-toggle submenu
   - applyLanguage(lang) with fade out/in
   - persist language in localStorage ("ogawa_lang")
   - fade-on-scroll (IntersectionObserver)
   - Formspree contact submit handling (inline responses)
*/
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.querySelector(".hamburger");
  const siteMenu = document.querySelector(".site-menu");
  const hasSub = document.querySelector(".has-submenu");
  const submenuToggle = document.querySelector(".submenu-toggle");
  const langOptions = Array.from(document.querySelectorAll(".lang-option"));
  const menuLinks = Array.from(document.querySelectorAll(".menu-link"));

  // safe query helper
  const safe = sel => document.querySelector(sel);

  // menu open/close
  function openMenu() {
    if (siteMenu) siteMenu.classList.add("open");
    if (hamburger) hamburger.setAttribute("aria-expanded", "true");
    if (siteMenu) siteMenu.setAttribute("aria-hidden", "false");
  }
  function closeMenu() {
    if (siteMenu) siteMenu.classList.remove("open");
    if (hasSub) hasSub.classList.remove("open");
    if (submenuToggle) submenuToggle.setAttribute("aria-expanded", "false");
    if (hamburger) hamburger.setAttribute("aria-expanded", "false");
    if (siteMenu) siteMenu.setAttribute("aria-hidden", "true");
  }

  if (hamburger) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      siteMenu.classList.contains("open") ? closeMenu() : openMenu();
    });
  }

  // click outside closes menu
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-menu") && !e.target.closest(".hamburger")) {
      closeMenu();
    }
  });

  // esc closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // submenu toggle (click-to-open / click-to-close)
  if (submenuToggle && hasSub) {
    submenuToggle.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const opening = hasSub.classList.toggle("open");
      submenuToggle.setAttribute("aria-expanded", opening ? "true" : "false");
      const submenu = document.getElementById("lang-list");
      if (submenu) submenu.setAttribute("aria-hidden", opening ? "false" : "true");
    });
  }

  // translations: keys used across index + subpages
  const translations = {
    en: {
      "hero-title":"Ogawa Matcha",
      "hero-text":"Authentic Japanese matcha, sourced from Kyoto’s finest tea fields.",
      "about-intro":"Our Story",
      "about-story1":"Ogawa Matcha began as a small passion project among friends who grew up near Kyoto’s terraced tea fields.",
      "about-story2":"Today, we work with farmers who use time-honored cultivation and stone-grinding techniques to preserve flavor and color.",
      "about-story3":"From seed to cup — a mindful, careful journey intended to bring quiet luxury to your day.",
      "products-title":"Products",
      "product1-title":"Matcha",
      "product1-text":"Ceremonial + culinary matcha — vibrant green, rich umami.",
      "product2-title":"Tea Kits",
      "product2-text":"Complete kits including chawan, chasen, and chashaku — ready for home ritual.",
      "product3-title":"Upcoming Events",
      "product3-text":"Tastings, workshops and seasonal tea ceremonies — RSVP when available.",
      "contact-title":"Contact Us",
      "contact-text":"Have any questions? Reach out anytime.",
      "contact-btn":"Email Us",
      /* matcha page */
      "matcha-page-title":"Our Matcha",
      "matcha-intro":"Three signature grades to match your mood.",
      "matcha1-title":"Tranquil Blend",
      "matcha1-text":"Smooth and lightly sweet — perfect for evening relaxation.",
      "matcha2-title":"Energy Boost",
      "matcha2-text":"Bright and bold — an uplifting morning ritual.",
      "matcha3-title":"Clarity Focus",
      "matcha3-text":"Balanced umami for clear mind and focused work.",
      /* kit page */
      "kit-page-title":"Matcha Tea Kits",
      "kit-intro":"Everything you need to prepare premium matcha at home.",
      "kit1-title":"Chawan (Tea Bowl)",
      "kit1-text":"Handcrafted bowls shaped for whisking and sipping.",
      "kit2-title":"Chasen (Bamboo Whisk)",
      "kit2-text":"A bamboo whisk that creates a smooth, frothy texture.",
      "kit3-title":"Chashaku (Bamboo Scoop)",
      "kit3-text":"Traditional scoop for measuring the perfect portion.",
      /* events page */
      "events-page-title":"Upcoming Events",
      "events-intro":"Join tastings, workshops, and seasonal tea ceremonies.",
      "event1-title":"Matcha Tasting",
      "event1-text":"Guided tasting of ceremonial grades.",
      "event2-title":"Tea Ceremony Workshop",
      "event2-text":"Learn the basic steps and etiquette.",
      "event3-title":"Blending Class",
      "event3-text":"Create your own culinary matcha blends."
    },
    ja: {
      "hero-title":"小川抹茶",
      "hero-text":"京都の最高級茶園から届く本格的な抹茶。",
      "about-intro":"私たちの物語",
      "about-story1":"小川抹茶は、京都の段々畑の近くで育った友人たちの小さな情熱プロジェクトとして始まりました。",
      "about-story2":"現在、色や旨味を守る伝統的な栽培・石臼挽きの農家と協力しています。",
      "about-story3":"種から一杯まで — 静かな贅沢を日常にお届けします。",
      "products-title":"商品",
      "product1-title":"抹茶",
      "product1-text":"儀式用と料理用 — 鮮やかな緑、豊かな旨味。",
      "product2-title":"ティーキット",
      "product2-text":"茶碗、茶筅、茶杓を含むセット — 自宅での茶道に。",
      "product3-title":"今後のイベント",
      "product3-text":"試飲会やワークショップ、季節の茶会を開催予定です。",
      "contact-title":"お問い合わせ",
      "contact-text":"ご質問があれば、いつでもご連絡ください。",
      "contact-btn":"メールを送る",
      /* matcha page */
      "matcha-page-title":"抹茶のご紹介",
      "matcha-intro":"気分に合わせた3つのブレンド。",
      "matcha1-title":"トランクイル（静寂）",
      "matcha1-text":"滑らかで柔らかな甘み — 夜のリラックスに最適。",
      "matcha2-title":"エナジーブースト",
      "matcha2-text":"明るく力強い — 朝の目覚めに。",
      "matcha3-title":"クラリティ（集中）",
      "matcha3-text":"心をすっきりさせるバランスの取れた旨味。",
      /* kit page */
      "kit-page-title":"抹茶ティーキット",
      "kit-intro":"自宅で本格抹茶を点てるためのセット。",
      "kit1-title":"茶碗（Chawan）",
      "kit1-text":"点てやすい形の手作り茶碗。",
      "kit2-title":"茶筅（Chasen）",
      "kit2-text":"ふわりと泡立てる竹製の茶筅。",
      "kit3-title":"茶杓（Chashaku）",
      "kit3-text":"適量をすくうための伝統的な竹製匙。",
      /* events page */
      "events-page-title":"イベント情報",
      "events-intro":"試飲会、ワークショップ、季節の茶会に参加しませんか。",
      "event1-title":"抹茶テイスティング",
      "event1-text":"儀式用の味わいをガイド付きで体験。",
      "event2-title":"茶席ワークショップ",
      "event2-text":"茶道の基本を学ぶワークショップです。",
      "event3-title":"ブレンドクラス",
      "event3-text":"オリジナルの料理用ブレンドを作ります。"
    },
    zh: {
      "hero-title":"小川抹茶",
      "hero-text":"源自京都顶级茶园的正宗抹茶。",
      "about-intro":"我们的故事",
      "about-story1":"小川抹茶起源于一群在京都茶园附近长大的朋友的热情项目。",
      "about-story2":"如今，我们与坚持传统栽培和石磨工艺的茶农合作，注重风味与色泽。",
      "about-story3":"从种子到一杯 — 带来静谧与精致的体验。",
      "products-title":"产品",
      "product1-title":"抹茶",
      "product1-text":"仪式用与烹饪用 — 鲜亮的绿色与丰富的旨味。",
      "product2-title":"茶具套装",
      "product2-text":"包含茶碗、茶筅、茶杓的完整套装。",
      "product3-title":"活动信息",
      "product3-text":"试饮会、工作坊与季节茶会的活动安排。",
      "contact-title":"联系我们",
      "contact-text":"如有任何问题，欢迎随时联系。",
      "contact-btn":"发送邮件",
      /* matcha page */
      "matcha-page-title":"我们的抹茶",
      "matcha-intro":"三款代表性茶品，匹配你的心情。",
      "matcha1-title":"宁静之选",
      "matcha1-text":"顺滑、微甜 — 适合夜晚放松。",
      "matcha2-title":"活力提神",
      "matcha2-text":"明亮而有力 — 早晨的唤醒仪式。",
      "matcha3-title":"清晰专注",
      "matcha3-text":"旨味平衡，适合学习与深度工作。",
      /* kit page */
      "kit-page-title":"抹茶套装",
      "kit-intro":"让你在家也能准备优质抹茶的全套工具。",
      "kit1-title":"茶碗 (Chawan)",
      "kit1-text":"适合打发与品饮的手作茶碗。",
      "kit2-title":"茶筅 (Chasen)",
      "kit2-text":"用竹制茶筅打出顺滑泡沫。",
      "kit3-title":"茶杓 (Chashaku)",
      "kit3-text":"用于取茶的传统竹勺。",
      /* events page */
      "events-page-title":"活动预告",
      "events-intro":"参加我们的品鉴会、工作坊与季节茶会。",
      "event1-title":"抹茶品鉴",
      "event1-text":"在导师引导下体验仪式用抹茶。",
      "event2-title":"茶道工作坊",
      "event2-text":"学习茶道的基本步骤与礼仪。",
      "event3-title":"混合配方课程",
      "event3-text":"为烘焙与咖啡调制你的专属抹茶混合。"
    }
  };

  // applyLanguage with fade out + in; persist to localStorage
  function applyLanguage(lang) {
    const els = Array.from(document.querySelectorAll("[data-key]"));
    if (!els.length) return;
    // fade out
    els.forEach(el => { el.style.transition = "opacity .28s ease"; el.style.opacity = "0"; });
    setTimeout(() => {
      els.forEach(el => {
        const key = el.getAttribute("data-key");
        if (translations[lang] && translations[lang][key]) {
          el.textContent = translations[lang][key];
        } else if (translations.en[key]) {
          el.textContent = translations.en[key];
        }
      });
      // fade in
      els.forEach(el => { el.style.opacity = "1"; });
      // persist choice
      try { localStorage.setItem("ogawa_lang", lang); } catch (err) { /* ignore */ }
    }, 300);
  }

  // attach click listeners to language options
  langOptions.forEach(opt => {
    opt.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const lang = opt.dataset.lang;
      applyLanguage(lang);
      // close submenu and menu after selection
      if (hasSub) hasSub.classList.remove("open");
      if (siteMenu) siteMenu.classList.remove("open");
    });
  });

  // close menu when anchor clicked
  menuLinks.forEach(a => {
    a.addEventListener("click", () => {
      closeMenu();
    });
  });

  // apply language from localStorage on load (default en)
  const saved = (function(){ try { return localStorage.getItem("ogawa_lang"); } catch(e){ return null; } })() || "en";
  applyLanguage(saved);

  // fade-on-scroll observer
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.16 });

  document.querySelectorAll(".fade-on-scroll, .about p, .product-card").forEach(el => {
    if (el) observer.observe(el);
  });

  // contact form (Formspree) - inline response
  const form = document.getElementById("contact-form");
  const responseDiv = document.getElementById("form-response");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (responseDiv) responseDiv.textContent = "";
      const data = new FormData(form);
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          if (responseDiv) { responseDiv.style.color = "var(--dark-green)"; responseDiv.textContent = "✅ Thank you — your message was sent."; }
          form.reset();
        } else {
          if (responseDiv) { responseDiv.style.color = "#c0392b"; responseDiv.textContent = "❌ Oops — message not sent. Please try again."; }
        }
      } catch (err) {
        if (responseDiv) { responseDiv.style.color = "#c0392b"; responseDiv.textContent = "❌ Network error — please try again later."; }
        console.error(err);
      }
    });
  }
});
