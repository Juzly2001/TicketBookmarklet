(() => {
  const positiveMsg =
    "Cảm ơn bạn đã yêu mến và dành nhiều lời khen cho Zalopay. Chúng mình sẽ tiếp tục hoàn thiện và nâng cao chất lượng dịch vụ ngày một tốt hơn!";
  const negativeMsg =
    "Chúng mình rất tiếc vì trải nghiệm không tốt của bạn. Bạn vui lòng vào ứng dụng Zalopay >> chọn 'Tài khoản' >> 'Trung tâm hỗ trợ' và cung cấp thông tin liên quan để có thể được hỗ trợ nhanh nhất nhé!";
  const delay = ms => new Promise(r => setTimeout(r, ms));

  function playBeep() {
    if (!soundOn) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  if (!document.getElementById("__autoReply_root")) {
    const root = document.createElement("div");
    root.id = "__autoReply_root";
    Object.assign(root.style, {
      position: "fixed",
      top: "40px",
      right: "16px",
      zIndex: 999999,
      display: "flex",
      gap: "8px",
      alignItems: "center",
      fontFamily: "system-ui, Arial"
    });
    document.body.appendChild(root);

    const statusText = document.createElement("div");
    statusText.id = "__autoReply_statusText";
    statusText.innerText =
      "✨ AutoReply sẵn sàng - nhấn (Ctrl + Space) để ẩn/hiện panel";
    Object.assign(statusText.style, {
      position: "absolute",
      top: "-25px",
      right: "0",
      background: "rgba(0,0,0,0.6)",
      color: "white",
      fontSize: "13px",
      padding: "4px 10px",
      borderRadius: "6px",
      fontFamily: "system-ui, Arial",
      boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
    });
    root.appendChild(statusText);

    const countdownText = document.createElement("div");
    countdownText.id = "__autoReply_countdown";
    countdownText.innerText = "";
    Object.assign(countdownText.style, {
      position: "absolute",
      top: "40px",
      right: "0",
      color: "#ffd700",
      fontSize: "13px",
      fontWeight: "bold",
      padding: "2px 10px",
      display: "none",
      background: "rgba(0,0,0,0.5)",
      borderRadius: "6px"
    });
    root.appendChild(countdownText);

    const autoBtn = document.createElement("button");
    autoBtn.id = "__autoReply_autoMode";
    autoBtn.innerText = "🟡 Tự động: TẮT";
    Object.assign(autoBtn.style, {
      padding: "10px 12px",
      background: "#6c757d",
      color: "white",
      fontSize: "14px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
    });

    const soundBtn = document.createElement("button");
    soundBtn.id = "__autoReply_sound";
    soundBtn.innerText = "🔇 Âm báo: TẮT";
    Object.assign(soundBtn.style, {
      padding: "10px 12px",
      background: "#6c757d",
      color: "white",
      fontSize: "14px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
    });

    const btn = document.createElement("button");
    btn.id = "__autoReply_start";
    btn.innerText = "🔍 Bắt đầu trả lời tuần tự";
    Object.assign(btn.style, {
      padding: "10px 14px",
      background: "#007aff",
      color: "white",
      fontSize: "14px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
    });

    const submitHelper = document.createElement("button");
    submitHelper.id = "__autoReply_clickSubmit";
    submitHelper.innerText = "▶️ Click Submit (X)";
    Object.assign(submitHelper.style, {
      padding: "10px 12px",
      background: "#00b894",
      color: "white",
      fontSize: "14px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
    });

    root.appendChild(btn);
    root.appendChild(submitHelper);
    root.appendChild(autoBtn);
    root.appendChild(soundBtn);
  }

  let autoMode = false;
  let soundOn = false;
  let currentReview = null;
  let submitReadyChecker = null;

  function getSortedReviews() {
    const reviews = [...document.querySelectorAll(".Box-sc-18eybku-0.idyRmo")];
    const withButtons = reviews
      .filter(div =>
        [...div.querySelectorAll("button")].some(btn =>
          /reply|edit response/i.test(btn.innerText)
        )
      )
      .map(div => ({
        el: div,
        rect: div.getBoundingClientRect(),
        btn: [...div.querySelectorAll("button")].find(b =>
          /reply|edit response/i.test(b.innerText)
        )
      }));

    withButtons.sort((a, b) => {
      if (Math.abs(a.rect.top - b.rect.top) > 10) return a.rect.top - b.rect.top;
      return a.rect.left - b.rect.left;
    });

    return withButtons;
  }

  function findNextUnreplied() {
    const all = getSortedReviews();
    return all.find(
      r => r.btn && r.btn.innerText.trim().toLowerCase() === "reply"
    );
  }

  function waitForResponseUpdate(callback) {
    if (!currentReview) return;
    const checkInterval = setInterval(() => {
      const reviewBtn = [...currentReview.el.querySelectorAll("button")].find(b =>
        /reply|edit response/i.test(b.innerText)
      );
      currentReview.btn = reviewBtn;
      const btnText = reviewBtn?.innerText?.trim().toLowerCase() || "reply";
      if (btnText === "edit response") {
        clearInterval(checkInterval);
        const startBtn = document.getElementById("__autoReply_start");
        if (startBtn)
          startBtn.innerText = "✅ Review đã phản hồi xong — Bấm để sang tiếp";
        callback?.();
      }
    }, 1000);
  }

  async function fillResponseTextForCurrentReview() {
    const stars = currentReview.el.querySelectorAll('svg[color="title"]').length;
    const textarea = document.querySelector("textarea#developerResponse");
    if (!textarea) return false;

    const message = stars >= 4 ? positiveMsg : negativeMsg;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    nativeSetter.call(textarea, message);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.value = message + " ";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    await delay(50);
    textarea.value = message;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  async function startProcessOnce() {
    const target = findNextUnreplied();
    if (!target) {
      alert("🎉 Tất cả review đã được phản hồi!");
      return;
    }
    currentReview = target;
    currentReview.el.scrollIntoView({ behavior: "smooth", block: "center" });
    currentReview.btn.click();

    let textarea;
    for (let i = 0; i < 30; i++) {
      textarea = document.querySelector("textarea#developerResponse");
      if (textarea) break;
      await delay(200);
    }
    if (!textarea) {
      alert("Không tìm thấy khung trả lời!");
      return;
    }

    const ok = await fillResponseTextForCurrentReview();
    if (!ok) return;

    const submitBtn = [...document.querySelectorAll("button")].find(
      b => b.textContent.trim() === "Submit"
    );
    if (submitBtn) {
      submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      submitBtn.style.boxShadow = "0 0 8px 2px #0070C9";
      if (submitReadyChecker) clearInterval(submitReadyChecker);
      submitReadyChecker = setInterval(() => {
        if (!submitBtn.disabled) {
          clearInterval(submitReadyChecker);
          playBeep();
        }
      }, 300);
    }

    const startBtn = document.getElementById("__autoReply_start");
    if (startBtn) startBtn.innerText = "⏳ Đang đợi phản hồi được lưu...";
    waitForResponseUpdate(async () => {
      if (startBtn) startBtn.innerText = "➡️ Sang review kế tiếp";
      if (autoMode) {
        await delay(1000);
        startProcessOnce();
      }
    });
  }

  const startBtnEl = document.getElementById("__autoReply_start");
  if (startBtnEl) {
    startBtnEl.onclick = () => {
      if (startBtnEl.innerText.includes("⏳")) {
        alert("Vui lòng đợi phản hồi được lưu xong (nút đổi thành Edit Response)");
        return;
      }
      startProcessOnce();
    };
  }

  const submitHelperEl = document.getElementById("__autoReply_clickSubmit");
  function clickSubmitAction() {
    const submitBtn = [...document.querySelectorAll("button")].find(
      b => b.textContent.trim() === "Submit"
    );
    if (!submitBtn) return alert("Không tìm thấy nút Submit.");
    if (submitBtn.disabled)
      return alert("Nút Submit hiện đang bị vô hiệu hóa.");
    submitBtn.click();
    const startBtn = document.getElementById("__autoReply_start");
    if (startBtn) startBtn.innerText = "⏳ Đang đợi phản hồi được lưu...";
  }
  if (submitHelperEl) {
    submitHelperEl.onclick = clickSubmitAction;
  }

  document.addEventListener("keydown", e => {
    if (e.key.toLowerCase() === "x") {
      e.preventDefault();
      clickSubmitAction();
    }
  });

  const autoBtnEl = document.getElementById("__autoReply_autoMode");
  if (autoBtnEl) {
    autoBtnEl.onclick = () => {
      autoMode = !autoMode;
      autoBtnEl.innerText = autoMode ? "🟢 Tự động: BẬT" : "🟡 Tự động: TẮT";
      autoBtnEl.style.background = autoMode ? "#28a745" : "#6c757d";
    };
  }

  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      const root = document.getElementById("__autoReply_root");
      if (!root) return;
      const isHidden = root.style.display === "none";
      root.style.display = isHidden ? "flex" : "none";
    }
  });

  const soundBtnEl = document.getElementById("__autoReply_sound");
  if (soundBtnEl) {
    soundBtnEl.onclick = () => {
      soundOn = !soundOn;
      soundBtnEl.innerText = soundOn ? "🔊 Âm báo: BẬT" : "🔇 Âm báo: TẮT";
      soundBtnEl.style.background = soundOn ? "#17a2b8" : "#6c757d";
      if (soundOn) playBeep();
    };
  }

  /* === 🧠 AUTO SUBMIT (5–50s delay) + hiển thị đếm ngược === */
  let autoSubmitOn = false;
  let checkInterval = null;
  let pendingTimeout = null;
  let countdownTimer = null;
  let customDelay = 10000; // 🆕 giá trị mặc định

  const countdownText = document.getElementById("__autoReply_countdown");

  const autoSubmitBtn = document.createElement("button");
  autoSubmitBtn.id = "__autoReply_autoSubmit";
  autoSubmitBtn.innerText = "⚪ Auto Submit: TẮT";
  Object.assign(autoSubmitBtn.style, {
    padding: "10px 12px",
    background: "#6c757d",
    color: "white",
    fontSize: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
  });
  document.getElementById("__autoReply_root").appendChild(autoSubmitBtn);

  // 🆕 Ô input để nhập delay (giây)
  const delayInput = document.createElement("input");
  delayInput.type = "number";
  delayInput.min = 1;
  delayInput.max = 999;
  delayInput.value = 25;
  delayInput.placeholder = "Delay (giây)";
  Object.assign(delayInput.style, {
    width: "90px",
    padding: "8px 6px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "14px",
    display: "none"
  });
  document.getElementById("__autoReply_root").appendChild(delayInput);

  const randMs = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  autoSubmitBtn.onclick = () => {
    autoSubmitOn = !autoSubmitOn;
    autoSubmitBtn.innerText = autoSubmitOn
      ? "🟢 Auto Submit: BẬT"
      : "⚪ Auto Submit: TẮT";
    autoSubmitBtn.style.background = autoSubmitOn ? "#28a745" : "#6c757d";
    delayInput.style.display = autoSubmitOn ? "block" : "none"; // 🆕 hiện/ẩn ô input

    if (autoSubmitOn) {
      if (!location.hostname.includes("appstoreconnect.apple.com")) {
        alert("Auto Submit chỉ hoạt động trên appstoreconnect.apple.com!");
        autoSubmitOn = false;
        autoSubmitBtn.innerText = "⚪ Auto Submit: TẮT";
        autoSubmitBtn.style.background = "#6c757d";
        delayInput.style.display = "none";
        return;
      }

      checkInterval = setInterval(() => {
        const submitBtn = [...document.querySelectorAll("button")].find(
          b => b.textContent.trim() === "Submit"
        );
        if (!submitBtn) return;
        if (!submitBtn.disabled && !pendingTimeout) {
          customDelay = Math.max(1, parseInt(delayInput.value) || 10) * 1000; // 🆕 lấy giá trị từ input
          let remain = Math.floor(customDelay / 1000);
          countdownText.style.display = "block";
          countdownText.innerText = `🕒 Auto submit sau ${remain}s`;

          countdownTimer = setInterval(() => {
            remain--;
            if (remain > 0) {
              countdownText.innerText = `🕒 Auto submit sau ${remain}s`;
            } else {
              clearInterval(countdownTimer);
            }
          }, 1000);

          pendingTimeout = setTimeout(() => {
            if (autoSubmitOn && !submitBtn.disabled) {
              submitBtn.click();
              playBeep();
            }
            pendingTimeout = null;
            countdownText.style.display = "none";
          }, customDelay);
        }
      }, 1000);
    } else {
      clearInterval(checkInterval);
      clearInterval(countdownTimer);
      checkInterval = null;
      countdownText.style.display = "none";
      if (pendingTimeout) clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
  };
})();
