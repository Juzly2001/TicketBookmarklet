(() => {
  const positiveMsg =
    "Cảm ơn bạn đã yêu mến và dành nhiều lời khen cho Zalopay. Chúng mình sẽ tiếp tục hoàn thiện và nâng cao chất lượng dịch vụ ngày một tốt hơn!";
  const negativeMsg =
    "Chúng mình rất tiếc vì trải nghiệm không tốt của bạn. Bạn vui lòng vào ứng dụng Zalopay >> chọn 'Tài khoản' >> 'Trung tâm hỗ trợ' và cung cấp thông tin liên quan để có thể được hỗ trợ nhanh nhất nhé!";
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // Âm báo đơn giản
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

  // Tạo giao diện nút điều khiển
  if (!document.getElementById("__autoReply_root")) {
    const root = document.createElement("div");
    root.id = "__autoReply_root";
    Object.assign(root.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: 999999,
      display: "flex",
      gap: "8px",
      alignItems: "center",
      fontFamily: "system-ui, Arial"
    });
    document.body.appendChild(root);

    // 🟢 Tự động
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

    // 🔊 Âm báo
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

    // Nút chính
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

    // Submit phụ
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

    // thêm vào giao diện
    root.appendChild(autoBtn);
    root.appendChild(soundBtn);
    root.appendChild(btn);
    root.appendChild(submitHelper);
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
      if (Math.abs(a.rect.top - b.rect.top) > 10)
        return a.rect.top - b.rect.top;
      return a.rect.left - b.rect.left;
    });

    return withButtons;
  }

  function findNextUnreplied() {
    const all = getSortedReviews();
    return all.find(r => r.btn && r.btn.innerText.trim().toLowerCase() === "reply");
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
    currentReview.el.style.outline = "3px solid #00c853";
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

      // Theo dõi khi submit khả dụng -> kêu "ting"
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

  // xử lý click Submit phụ và phím tắt Ctrl+X
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

  // 🎹 Phím tắt X để bấm Submit
  document.addEventListener("keydown", e => {
    // if (e.ctrlKey && e.key.toLowerCase() === "x")
    if (e.key.toLowerCase() === "x"){
      e.preventDefault();
      clickSubmitAction();
    }
  });

  // ⚙️ Nút tự động bật/tắt
  const autoBtnEl = document.getElementById("__autoReply_autoMode");
  if (autoBtnEl) {
    autoBtnEl.onclick = () => {
      autoMode = !autoMode;
      autoBtnEl.innerText = autoMode ? "🟢 Tự động: BẬT" : "🟡 Tự động: TẮT";
      autoBtnEl.style.background = autoMode ? "#28a745" : "#6c757d";
    };
  }

  // 🔊 Nút bật/tắt âm báo
  const soundBtnEl = document.getElementById("__autoReply_sound");
  if (soundBtnEl) {
    soundBtnEl.onclick = () => {
      soundOn = !soundOn;
      soundBtnEl.innerText = soundOn ? "🔊 Âm báo: BẬT" : "🔇 Âm báo: TẮT";
      soundBtnEl.style.background = soundOn ? "#17a2b8" : "#6c757d";
      if (soundOn) playBeep();
    };
  }
})();
