const config = window.APP_CONFIG;
const $ = (id) => document.getElementById(id);
const form = $("rsvpForm");
const submitBtn = $("submitBtn");
const closedMessage = $("closedMessage");
const modal = new bootstrap.Modal($("successModal"));
const feedbackIcon = $("feedbackIcon");
const feedbackTitle = $("feedbackTitle");
const successIcon = document.querySelector(".success-icon");
const guestSelect = $("guestSelect");
const guestToggle = guestSelect.querySelector(".custom-select-toggle");
const guestText = $("guestSelectText");
const guestInput = $("guestCount");
const guestOptions = [...guestSelect.querySelectorAll(".custom-select-option")];
let formClosed = false;

$("name").addEventListener("input", (event) => {
  event.target.value = event.target.value.toUpperCase();
});

$("phone").addEventListener("blur", (event) => {
  const normalized = normalizePhone(event.target.value);
  if (normalized) event.target.value = normalized;
});

function normalizePhone(value) {
  let digits = String(value || "").replace(/[^\d+]/g, "");
  digits = digits.startsWith("+") ? digits.slice(1) : digits;

  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (digits.startsWith("8")) digits = "62" + digits;

  return digits.startsWith("62") ? "+" + digits : "";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function showFeedback(type, message) {
  const isError = type === "error";
  successIcon.classList.toggle("bg-success-subtle", !isError);
  successIcon.classList.toggle("text-success", !isError);
  successIcon.classList.toggle("bg-danger-subtle", isError);
  successIcon.classList.toggle("text-danger", isError);
  feedbackIcon.className = isError ? "bi bi-exclamation-lg" : "bi bi-check2";
  feedbackTitle.textContent = isError ? "Mohon maaf" : "Terima kasih!";
  $("successText").textContent = message;
  modal.show();
}

function setGuestValue(value) {
  const label = value + " orang";
  guestInput.value = value;
  guestText.textContent = label;
  guestOptions.forEach((option) => {
    const selected = option.dataset.value === value;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function closeGuestSelect() {
  guestSelect.classList.remove("is-open");
  guestToggle.setAttribute("aria-expanded", "false");
}

function toggleGuestSelect() {
  if (guestToggle.disabled) return;
  guestSelect.classList.toggle("is-open");
  guestToggle.setAttribute("aria-expanded", guestSelect.classList.contains("is-open") ? "true" : "false");
}

function closeForm(message) {
  formClosed = true;
  closedMessage.classList.remove("d-none");
  closedMessage.querySelector(".small").textContent = message;
  [...form.elements].forEach((el) => {
    el.disabled = true;
  });
  guestToggle.disabled = true;
  closeGuestSelect();
}

function applyStats(stats) {
  $("registeredText").textContent = formatNumber(stats.registered);
  $("limitText").textContent = formatNumber(stats.limit);
  $("quotaBar").style.width = stats.percent.toFixed(1) + "%";
  $("percentText").textContent = Math.round(stats.percent) + "% terisi";
  $("remainingText").textContent = formatNumber(stats.remaining) + " slot tersisa";

  if (stats.closed || stats.remaining <= 0) {
    closeForm("Kuota pendaftaran sudah penuh.");
  }
}

function formatDeadline() {
  const deadline = new Date(config.deadline);
  $("deadlineLabel").textContent = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(deadline) + " WIB";
}

function updateCountdown() {
  const deadline = new Date(config.deadline).getTime();
  let diff = deadline - Date.now();

  if (diff <= 0) {
    diff = 0;
    if (!formClosed) closeForm("Batas waktu pendaftaran telah berakhir.");
  }

  $("days").textContent = String(Math.floor(diff / 86400000)).padStart(2, "0");
  $("hours").textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
  $("minutes").textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  $("seconds").textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
}

function createSnow() {
  const layer = $("snowLayer");
  const count = window.innerWidth < 768 ? 28 : 55;

  for (let i = 0; i < count; i++) {
    const snow = document.createElement("span");
    snow.className = "snow";
    snow.textContent = Math.random() > 0.6 ? "*" : ".";
    snow.style.left = Math.random() * 100 + "vw";
    snow.style.fontSize = Math.random() * 14 + 8 + "px";
    snow.style.animationDuration = Math.random() * 7 + 7 + "s";
    snow.style.animationDelay = -Math.random() * 12 + "s";
    snow.style.opacity = Math.random() * 0.55 + 0.2;
    layer.appendChild(snow);
  }
}

function celebrate() {
  if (typeof confetti !== "function") return;
  confetti({ particleCount: 130, spread: 80, origin: { y: 0.65 } });
}

guestToggle.addEventListener("click", toggleGuestSelect);

guestOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setGuestValue(option.dataset.value);
    closeGuestSelect();
    guestToggle.focus();
  });
});

document.addEventListener("click", (event) => {
  if (!guestSelect.contains(event.target)) closeGuestSelect();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGuestSelect();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (formClosed) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';

  try {
    const response = await fetch("/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const result = await response.json();

    if (!response.ok) {
      showFeedback("error", result.message || "Data gagal disimpan.");
      return;
    }

    applyStats(result.stats);
    showFeedback("success", result.message);
    celebrate();
    form.reset();
    setGuestValue("1");
  } catch (error) {
    showFeedback("error", "Tidak dapat terhubung ke server.");
  } finally {
    if (!formClosed) submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-send-fill me-2"></i>Kirim Konfirmasi';
  }
});

createSnow();
formatDeadline();
updateCountdown();
setInterval(updateCountdown, 1000);
