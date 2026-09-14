const BANNERS_URL = "data/banners.json";
const ANIMATIONS_URL = "data/animations.json";
const BANNERS_BASE = "assets/banners/";
const RUFFLE_SRC = "assets/ruffle/ruffle.js";

const grid = document.getElementById("banner-grid");
const videoGrid = document.getElementById("video-grid");

const overlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalMeta = document.getElementById("modal-meta");
const modalStageInner = document.getElementById("modal-stage-inner");
const modalClose = document.getElementById("modal-close");

let rufflePlayer = null;
let ruffleLoading = null;

function loadRuffle() {
  if (window.RufflePlayer) return Promise.resolve();
  if (ruffleLoading) return ruffleLoading;
  ruffleLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RUFFLE_SRC;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return ruffleLoading;
}

function extOf(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(filename || "");
  return m ? m[1].toLowerCase() : "";
}

function buildPlaceholder(title) {
  const el = document.createElement("div");
  el.className = "thumb-placeholder";
  el.textContent = title;
  return el;
}

function closeModal() {
  overlay.classList.remove("open");
  modalStageInner.innerHTML = "";
  if (rufflePlayer) {
    try { rufflePlayer.remove(); } catch (e) { /* noop */ }
    rufflePlayer = null;
  }
}

function fitStage(nativeWidth, nativeHeight) {
  const maxW = Math.min(window.innerWidth * 0.8, 900);
  const maxH = window.innerHeight * 0.62;
  const scale = Math.min(1, maxW / nativeWidth, maxH / nativeHeight);
  return scale;
}

async function openBanner(item) {
  modalTitle.textContent = item.title;
  modalMeta.textContent = `${item.width || "?"}×${item.height || "?"} px · ${extOf(item.file).toUpperCase()}`;
  modalStageInner.innerHTML = "";
  overlay.classList.add("open");

  const ext = extOf(item.file);
  const fileUrl = BANNERS_BASE + item.file;

  if (ext === "swf") {
    modalStageInner.innerHTML = '<div style="color:#9497a6;font-size:13px;">Loading Ruffle…</div>';
    try {
      await loadRuffle();
      const ruffle = window.RufflePlayer.newest();
      const player = ruffle.createPlayer();
      const w = item.width || 300;
      const h = item.height || 250;
      const scale = fitStage(w, h);
      player.style.width = w + "px";
      player.style.height = h + "px";
      player.style.transform = `scale(${scale})`;
      player.style.transformOrigin = "center center";
      player.style.display = "block";
      modalStageInner.innerHTML = "";
      modalStageInner.appendChild(player);
      rufflePlayer = player;
      player.load(fileUrl);
    } catch (e) {
      modalStageInner.innerHTML = '<div style="color:#ff5a5f;font-size:13px;">Could not load Ruffle player.</div>';
    }
  } else {
    const img = document.createElement("img");
    img.src = fileUrl;
    img.alt = item.title;
    const w = item.width || 400;
    const h = item.height || 400;
    const scale = fitStage(w, h);
    img.style.width = w + "px";
    img.style.height = h + "px";
    img.style.transform = `scale(${scale})`;
    img.style.transformOrigin = "center center";
    img.style.display = "block";
    modalStageInner.appendChild(img);
  }
}

function renderBanners(items) {
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "banner-card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const hasCoverableSrc = item.cover || extOf(item.file) !== "swf";
    if (hasCoverableSrc) {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = item.title;
      img.src = item.cover ? BANNERS_BASE + item.cover : BANNERS_BASE + item.file;
      img.onerror = () => {
        img.remove();
        thumb.appendChild(buildPlaceholder(item.title));
      };
      thumb.appendChild(img);
    } else {
      thumb.appendChild(buildPlaceholder(item.title));
    }

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = extOf(item.file);
    thumb.appendChild(badge);

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="dims">${item.width || "?"}×${item.height || "?"}</div>
    `;

    card.appendChild(thumb);
    card.appendChild(info);
    card.addEventListener("click", () => openBanner(item));

    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function renderVideos(items) {
  videoGrid.innerHTML = "";
  const frag = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "video-card";

    const frameWrap = document.createElement("div");
    frameWrap.className = "frame-wrap";

    const thumbImg = document.createElement("img");
    thumbImg.loading = "lazy";
    thumbImg.alt = item.title;
    thumbImg.src = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

    const playBtn = document.createElement("div");
    playBtn.className = "play-btn";
    playBtn.innerHTML = `
      <svg viewBox="0 0 68 48"><path d="M66.5 7.7c-.8-2.9-2.4-4.5-5.3-5.3C57.2 1 34 1 34 1S10.8 1 6.7 2.4C3.9 3.2 2.2 4.8 1.4 7.7 0 11.8 0 24 0 24s0 12.2 1.4 16.3c.8 2.9 2.4 4.5 5.3 5.3C10.8 47 34 47 34 47s23.2 0 27.3-1.4c2.9-.8 4.5-2.4 5.3-5.3C68 36.2 68 24 68 24s0-12.2-1.4-16.3z" fill="#ff0000" fill-opacity="0.85"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>
    `;

    frameWrap.appendChild(thumbImg);
    frameWrap.appendChild(playBtn);
    frameWrap.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0`;
      iframe.title = item.title;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      frameWrap.innerHTML = "";
      frameWrap.appendChild(iframe);
    }, { once: true });

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="meta">${item.duration || ""} ${item.year ? "· " + item.year : ""}</div>
    `;

    card.appendChild(frameWrap);
    card.appendChild(info);
    frag.appendChild(card);
  });

  videoGrid.appendChild(frag);
}

modalClose.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

Promise.all([
  fetch(BANNERS_URL).then((r) => r.json()),
  fetch(ANIMATIONS_URL).then((r) => r.json()),
])
  .then(([banners, animations]) => {
    renderBanners(banners);
    renderVideos(animations);
  })
  .catch((err) => {
    grid.innerHTML = `<p style="color:#ff5a5f">Ошибка загрузки: ${err.message}</p>`;
    console.error(err);
  });
