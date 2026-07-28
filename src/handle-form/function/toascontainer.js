export function showToast(message, type = "success") {

  const icons = {
    success: "✔",
    error: "✖",
    warning: "⚠",
    Unknown: "❓",
    scan: "📡",
    tag: "🏷️",
    blocked: "🚫"
  };

  let container = document.getElementById("toastContainer");

  // 🔥 FIX: create container if missing
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "fixed top-5 right-5 z-50 space-y-2";
    document.body.appendChild(container);
  }

  const toastEl = document.createElement("div");
  toastEl.className = `toast-msg toast-${type}`;
  toastEl.innerHTML = `
    <span class="toast-icon">${icons[type] || "❓"}</span>
    <span class="toast-text">${message}</span>
    <button class="toast-close">&times;</button>
    <div class="toast-progress"></div>
  `;

  
  container.appendChild(toastEl);

  const progress = toastEl.querySelector(".toast-progress");
  progress.style.transition = "width 5s linear";
  setTimeout(() => { progress.style.width = "0%"; }, 50);

  const timeout = setTimeout(() => toastEl.remove(), 5000);

  toastEl.querySelector(".toast-close").addEventListener("click", () => {
    clearTimeout(timeout);
    toastEl.remove();
  });
}