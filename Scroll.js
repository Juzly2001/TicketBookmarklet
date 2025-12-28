(() => {
  const BTN_ID = "__autoScroll_btn";
  const STATE_KEY = "__autoScroll_interval";

  // Nếu đã tồn tại button thì không tạo lại
  if (document.getElementById(BTN_ID)) return;

  let isOn = false;

  function startScroll() {
    window[STATE_KEY] = setInterval(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 800);
  }

  function stopScroll() {
    clearInterval(window[STATE_KEY]);
    window[STATE_KEY] = null;
  }

  // Tạo button
  const btnScroll = document.createElement("button");
  btnScroll.id = BTN_ID;
  btnScroll.innerText = "▶️ Auto Scroll (S): TẮT";

  Object.assign(btnScroll.style, {
    position: "fixed",
    top: "7px",
    right: "16px",
    zIndex: 2147483647,
    padding: "8px 10px",
    fontSize: "13px",
    fontWeight: "600",
    background: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  });

  function toggleScroll() {
    isOn = !isOn;
    if (isOn) {
      startScroll();
      btnScroll.innerText = "⏹️ Auto Scroll (S): BẬT";
      btnScroll.style.background = "#28a745";
    } else {
      stopScroll();
      btnScroll.innerText = "▶️ Auto Scroll (S): TẮT";
      btnScroll.style.background = "#6c757d";
    }
  }

  btnScroll.onclick = toggleScroll;

  // Lắng nghe phím
  document.addEventListener("keydown", (e) => {
    // Phím S để bật/tắt auto scroll
    if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      toggleScroll();
    }

    // Ctrl + Space để ẩn/hiện button
    if (e.key === " " && e.ctrlKey) {
      e.preventDefault();
      btnScroll.style.display = btnScroll.style.display === "none" ? "block" : "none";
    }
  });

  document.body.appendChild(btnScroll);
})();
