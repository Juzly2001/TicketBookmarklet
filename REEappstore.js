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

    // ---------------------------------------------------------
    // state mới: đếm và limit
    // ---------------------------------------------------------
    let repliedCount = 0;
    let replyLimit = 100; // mặc định gợi ý
    let limitEnabled = false;

    function formatLimitText() {
      return limitEnabled ? `${repliedCount} / ${replyLimit}` : `${repliedCount} / -`;
    }

    // ---------------------------------------------------------
    // tạo UI (floating card - modern white)
    // ---------------------------------------------------------
    // --- PHẦN GIAO DIỆN CHỈNH SỬA (thay thế đoạn tạo UI gốc) ---
    if (!document.getElementById("__autoReply_root")) {
      const root = document.createElement("div");
      root.id = "__autoReply_root";
      Object.assign(root.style, {
        position: "fixed",
        top: "40px",
        right: "16px",
        zIndex: 2147483647,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "10px",
        fontFamily: "system-ui, Arial",
        width: "320px",
        boxSizing: "border-box",
      });
      document.body.appendChild(root);

      const card = document.createElement("div");
      card.id = "__autoReply_card";
      Object.assign(card.style, {
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "14px 16px",
        color: "#111",
      });
      root.appendChild(card);

      // Header
      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.marginBottom = "10px";
      const title = document.createElement("div");
      title.innerHTML = "<strong>✨ AutoReply</strong>";
      title.style.fontSize = "15px";
      header.appendChild(title);
      const countText = document.createElement("div");
      countText.id = "__autoReply_countStatus";
      countText.innerText = `✅ Replied: ${formatLimitText()}`;
      Object.assign(countText.style, {
        fontSize: "13px",
        fontWeight: "600",
        color: "#007aff",
      });
      header.appendChild(countText);
      card.appendChild(header);

      // Grid các nút
      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "1fr 1fr";
      grid.style.gap = "8px";
      card.appendChild(grid);

      // Nút chính
      const startBtn = document.createElement("button");
      startBtn.id = "__autoReply_start";
      startBtn.innerText = "🔍 Start reply.";
      Object.assign(startBtn.style, {
        gridColumn: "1 / span 2",
        padding: "10px",
        background: "#007aff",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        cursor: "pointer",
        fontWeight: "600",
        boxShadow: "0 4px 10px rgba(0,122,255,0.25)",
      });
      grid.appendChild(startBtn);

      // 2 nút nhỏ
      const btnSubmit = document.createElement("button");
      btnSubmit.id = "__autoReply_clickSubmit";
      btnSubmit.innerText = "▶️ Click Submit (Q)";
      Object.assign(btnSubmit.style, {
        padding: "8px",
        background: "#00b67a",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
        cursor: "pointer",
      });
      grid.appendChild(btnSubmit);

      const btnNext = document.createElement("button");
      btnNext.id = "__autoReply_backup";
      btnNext.innerText = "⏭️ Next Review (W)";
      Object.assign(btnNext.style, {
        padding: "8px",
        background: "#ff6b6b",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
        cursor: "pointer",
      });
      grid.appendChild(btnNext);

      // Hàng nút chế độ
      const modeRow = document.createElement("div");
      modeRow.style.display = "grid";
      modeRow.style.gridTemplateColumns = "1fr 1fr";
      modeRow.style.gap = "8px";
      modeRow.style.marginTop = "10px";
      card.appendChild(modeRow);

      const autoBtn = document.createElement("button");
      autoBtn.id = "__autoReply_autoMode";
      autoBtn.innerText = "⚪ Auto (E): OFF";
      Object.assign(autoBtn.style, {
        padding: "8px",
        background: "#6c757d",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
      });
      modeRow.appendChild(autoBtn);

      const soundBtn = document.createElement("button");
      soundBtn.id = "__autoReply_sound";
      soundBtn.innerText = "🔇 Sound: OFF";
      Object.assign(soundBtn.style, {
        padding: "8px",
        background: "#6c757d",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
      });
      modeRow.appendChild(soundBtn);

      const autoSubmitBtn = document.createElement("button");
      autoSubmitBtn.id = "__autoReply_autoSubmit";
      autoSubmitBtn.innerText = "⚪ Auto Submit: OFF";
      Object.assign(autoSubmitBtn.style, {
        padding: "8px",
        background: "#6c757d",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "13px",
        marginTop: "8px",
        width: "100%",
        display: "none"
      });
      card.appendChild(autoSubmitBtn);

      // === THAY ĐỔI: tạo ô input delay ngay dưới nút Auto Submit ===
      const delayInputEl = document.createElement("input");
      delayInputEl.id = "__autoReply_delayInput";
      delayInputEl.type = "number";
      delayInputEl.min = 1;
      delayInputEl.value = 5;
      delayInputEl.placeholder = "Auto Submit Delay (giây)";
      Object.assign(delayInputEl.style, {
        width: "100%",
        padding: "8px 6px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "13px",
        display: "none",
        marginTop: "8px",
        marginBottom: "0px",
      });
      card.appendChild(delayInputEl);
      // === kết thúc thay đổi ===

      // Giới hạn rep (giao diện giống auto submit)
          const limitToggle = document.createElement("button");
          limitToggle.id = "__autoReply_limitToggle";
          limitToggle.innerText = "⚪ Limit: OFF";
          Object.assign(limitToggle.style, {
          padding: "8px",
          background: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "13px",
          cursor: "pointer",
          marginTop: "8px",
          width: "100%",
          });
          card.appendChild(limitToggle);

          const limitInput = document.createElement("input");
          limitInput.id = "__autoReply_limitInput";
          limitInput.type = "number";
          limitInput.min = 1;
          limitInput.value = replyLimit;
          Object.assign(limitInput.style, {
          width: "100%",
          padding: "8px 6px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontSize: "13px",
          display: "none",
          marginTop: "8px",
          marginBottom: "0px",
      });
      card.appendChild(limitInput);


      // Ghi chú
      const footer = document.createElement("div");
      footer.style.marginTop = "10px";
      footer.style.textAlign = "center";
      footer.style.fontSize = "12px";
      footer.style.color = "#666";
      footer.innerText = "Ctrl+Space => Ẩn/hiện";
      card.appendChild(footer);
    }

    // lấy các phần tử UI
    const startBtnEl = document.getElementById("__autoReply_start");
    const submitHelperEl = document.getElementById("__autoReply_clickSubmit");
    const backupBtnEl = document.getElementById("__autoReply_backup");
    const autoBtnEl = document.getElementById("__autoReply_autoMode");
    const soundBtnEl = document.getElementById("__autoReply_sound");
    const autoSubmitBtnEl = document.getElementById("__autoReply_autoSubmit");
    const countdownTextEl = document.getElementById("__autoReply_countdown");
    const countStatusEl = document.getElementById("__autoReply_countStatus");
    const statusTextEl = document.getElementById("__autoReply_statusText");
    const limitToggleEl = document.getElementById("__autoReply_limitToggle");
    const limitInputEl = document.getElementById("__autoReply_limitInput");

    function updateCountUI() {
      if (countStatusEl) countStatusEl.innerText = `✅ Replied: ${formatLimitText()}`;
    }

    // cập nhật limit từ input
    if (limitInputEl) {
      limitInputEl.addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v > 0) {
          replyLimit = v;
          updateCountUI();
        }
      });
    }

    if (limitToggleEl) {
    limitToggleEl.onclick = () => {
      limitEnabled = !limitEnabled;
      limitToggleEl.innerText = limitEnabled ? "🟢 Limit: ON" : "⚪ Limit: OFF";
      limitToggleEl.style.background = limitEnabled ? "#28a745" : "#6c757d";
      if (limitInputEl) limitInputEl.style.display = limitEnabled ? "block" : "none";
      updateCountUI();
    };
  }

    let autoMode = false;
    let soundOn = false;
    let currentReview = null;
    let submitReadyChecker = null;

    // === NEW: fallback timer khi review không được lưu trong 30s ===
    let fallbackTimer = null;
    const FALLBACK_TIMEOUT_MS = 30000; // 30 giây

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

    function stopAllAuto(reason) {
      // Dừng mọi chế độ auto và clear timers
      autoMode = false;
      if (autoBtnEl) {
        autoBtnEl.innerText = "⚪ Auto (E): OFF";
        autoBtnEl.style.background = "#6c757d";
      }
      autoSubmitOn = false;
      if (autoSubmitBtnEl) {
        autoSubmitBtnEl.innerText = "⚪ Auto Submit: OFF";
        autoSubmitBtnEl.style.background = "#6c757d";
      }
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
      }
      if (pendingTimeout) pendingTimeout = null;
      if (countdownTextEl) countdownTextEl.style.display = "none";
      // clear fallback & submitReadyChecker
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (submitReadyChecker) {
        clearInterval(submitReadyChecker);
        submitReadyChecker = null;
      }
      // reset currentReview
      currentReview = null;
      // reset start button text for clarity
      const startBtn = document.getElementById("__autoReply_start");
      if (startBtn) startBtn.innerText = "🔍 Start reply.";
      // thông báo (theo lựa chọn bạn muốn 2A = tự động dừng + hiện thông báo)
      if (reason && typeof reason === "string") {
        alert(reason);
      }
      // Cập nhật status
      if (statusTextEl) statusTextEl.innerText = "⏹️ Stop Auto";
      // update count UI if present
      const delayInput = document.getElementById("__autoReply_delayInput");
      if (delayInput) delayInput.style.display = "none";

      updateCountUI();
    }

    const countedReviews = new WeakSet();

    function waitForResponseUpdate(callback) {
      if (!currentReview) return;
      const reviewRef = currentReview;
      const checkInterval = setInterval(() => {
        const reviewBtn = [...reviewRef.el.querySelectorAll("button")].find(b =>
          /reply|edit response/i.test(b.innerText)
        );
        const btnText = reviewBtn?.innerText?.trim().toLowerCase() || "reply";
        if (btnText === "edit response" && !countedReviews.has(reviewRef.el)) {
          countedReviews.add(reviewRef.el);
          clearInterval(checkInterval);
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          repliedCount++;
          updateCountUI();
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

    // === NEW: hành động backup (bỏ review hiện tại và sang tiếp) ===
    function triggerBackup(skipCurrent = true) {
      try {
        // clear any fallback timer first
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }

        const all = getSortedReviews();
        // nếu skipCurrent thì bỏ qua currentReview (nếu tồn tại)
        let target;
        if (skipCurrent && currentReview) {
          target = all.find(r => r.el !== currentReview.el && r.btn && r.btn.innerText.trim().toLowerCase() === "reply");
        } else {
          target = all.find(r => r.btn && r.btn.innerText.trim().toLowerCase() === "reply");
        }
        if (!target) {
          alert("🎉 Không tìm thấy review chưa trả lời để backup — có thể đã hết review.");
          return;
        }
        // cập nhật start button trạng thái
        const startBtn = document.getElementById("__autoReply_start");
        if (startBtn) startBtn.innerText = "➡️ Backup ~ Find next reply.";

        // scroll và click
        target.el.scrollIntoView({ behavior: "smooth", block: "center" });
        target.btn.click();
        // set currentReview thành target mới và tiếp tục quy trình tương tự
        currentReview = target;

        // tiếp tục: chờ textarea, fill, và highlight nút Submit như bình thường
        (async () => {
          let textarea;
          for (let i = 0; i < 30; i++) {
            textarea = document.querySelector("textarea#developerResponse");
            if (textarea) break;
            await delay(200);
          }
          if (!textarea) {
            alert("Không tìm thấy khung trả lời sau khi backup!");
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

          // đặt lại fallback: nếu sau FALLBACK_TIMEOUT_MS vẫn chưa lưu được => chạy backup nữa
          if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          fallbackTimer = setTimeout(() => {
            // nếu nút vẫn chưa là "edit response" thì chạy backup tự động tiếp
            const btnText = (currentReview && [...currentReview.el.querySelectorAll("button")].find(b => /reply|edit response/i.test(b.innerText))?.innerText || "").trim().toLowerCase();
            if (btnText === "reply") {
              triggerBackup(true);
            }
          }, FALLBACK_TIMEOUT_MS);

          waitForResponseUpdate(async () => {
            if (startBtn) startBtn.innerText = "➡️ Find next reply.";
            if (autoMode) {
              await delay(1000);
              startProcessOnce();
            }
          });
        })();
      } catch (e) {
        console.error("triggerBackup error:", e);
      }
    }

    async function startProcessOnce() {
      // nếu đã đạt limit -> dừng
      if (limitEnabled && repliedCount >= replyLimit) {
        stopAllAuto(`🎯 Đã đạt giới hạn ${replyLimit} review — Tự động OFF.`);
        return;
      }

      const target = findNextUnreplied();
      if (!target) {
        // Khi không còn review chưa trả lời -> tự OFF auto mode
        stopAllAuto("🎉 Tất cả review đã được phản hồi — Tự động OFF.");
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

      // === NEW: đặt fallback timer 30s nếu review không chuyển sang "edit response" ===
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      fallbackTimer = setTimeout(() => {
        // kiểm tra lại trạng thái nút của currentReview
        try {
          const reviewBtn = currentReview && [...currentReview.el.querySelectorAll("button")].find(b => /reply|edit response/i.test(b.innerText));
          const btnText = (reviewBtn?.innerText || "").trim().toLowerCase();
          if (btnText === "reply") {
            // nếu vẫn là reply => tự động chạy backup
            const startBtnEl = document.getElementById("__autoReply_start");
            if (startBtnEl) startBtnEl.innerText = "⚠️ Timeout 30s — Chạy backup";
            triggerBackup(true);
          }
        } catch (e) {
          console.error("fallback check error:", e);
        }
      }, FALLBACK_TIMEOUT_MS);

      waitForResponseUpdate(async () => {
        if (startBtn) startBtn.innerText = "➡️ Find next reply.";
        if (autoMode) {
          await delay(1000);
          startProcessOnce();
        }
      });
    }

    if (startBtnEl) {
      startBtnEl.onclick = () => {
        if (startBtnEl.innerText.includes("⏳")) {
          alert("Vui lòng đợi phản hồi được lưu xong (nút đổi thành Edit Response)");
          return;
        }
        startProcessOnce();
      };
    }

    function clickSubmitAction() {
      const submitBtn = [...document.querySelectorAll("button")].find(
        b => b.textContent.trim() === "Submit"
      );
      if (!submitBtn) return alert("Không tìm thấy nút Submit.");
      if (submitBtn.disabled)
        return alert("Nút Submit hiện đang bị vô hiệu hóa.");
      submitBtn.click();
      const startBtn = document.getElementById("__autoReply_start");
      if (startBtn) startBtn.innerText = "⏳ Waiting for reply to be saved...";
    }
    if (submitHelperEl) {
      submitHelperEl.onclick = clickSubmitAction;
    }

    // gắn backup nút
    if (backupBtnEl) {
      backupBtnEl.onclick = () => {
        triggerBackup(true);
      };
    }



      /* === 🧠 AUTO SUBMIT: delay ngẫu nhiên từ 0 đến số nhập === */
    let autoSubmitOn = false;
    let checkInterval = null;
    let pendingTimeout = null;
    let countdownTimer = null;

    function enableAutoSubmitProgrammatically() {
    if (!autoSubmitOn) {
      autoSubmitOn = true;
      autoSubmitBtnEl.innerText = "🟢 Auto Submit: ON";
      autoSubmitBtnEl.style.background = "#28a745";
      const delayInput = document.getElementById("__autoReply_delayInput");
      if (delayInput) delayInput.style.display = "block";

      // chạy giống phần trong autoSubmitBtnEl.onclick
      checkInterval = setInterval(() => {
        const submitBtn = [...document.querySelectorAll("button")].find(
          b => b.textContent.trim() === "Submit"
        );
        if (!submitBtn) return;
        if (!submitBtn.disabled && !pendingTimeout) {
          const delayInputEl = document.getElementById("__autoReply_delayInput");
          const maxDelay = Math.max(1, parseInt(delayInputEl?.value) || 10);
          const randomDelay = Math.random() * maxDelay * 1000;
          let remain = Math.floor(randomDelay / 1000);

          if (countdownTextEl) {
            countdownTextEl.style.display = "block";
            countdownTextEl.innerText = `🕒 Auto submit sau ${remain}s`;
          }

          clearInterval(countdownTimer);
          countdownTimer = setInterval(() => {
            remain--;
            if (remain > 0) {
                  if (countdownTextEl) countdownTextEl.innerText = `🕒 Auto submit sau ${remain}s`;
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
                if (countdownTextEl) countdownTextEl.style.display = "none";
              }, randomDelay);
            }
          }, 1000);
        }
  }

  if (autoBtnEl) {
    autoBtnEl.onclick = () => {
      autoMode = !autoMode;
      autoBtnEl.innerText = autoMode ? "🟢 Auto (E): ON" : "⚪ Auto (E): OFF";
      autoBtnEl.style.background = autoMode ? "#28a745" : "#6c757d";

      // ✅ Khi ON autoMode, autoSubmitOn cũng tự ON
      if (autoMode && !autoSubmitOn) {
    enableAutoSubmitProgrammatically();
  }

      // nếu ON autoMode, bắt đầu quy trình nếu có review
      if (autoMode) {
        if (limitEnabled && repliedCount >= replyLimit) {
          stopAllAuto(`🎯 Đã đạt giới hạn ${replyLimit} review – Tự động OFF.`);
          return;
        }
        startProcessOnce();
      } else {
        // khi OFF autoMode thì OFF luôn autoSubmit
        autoSubmitOn = false;
        autoSubmitBtnEl.innerText = "⚪ Auto Submit: OFF";
        autoSubmitBtnEl.style.background = "#6c757d";
        const delayInput = document.getElementById("__autoReply_delayInput");
        if (delayInput) delayInput.style.display = "none";
      }
    };
  }



    if (soundBtnEl) {
      soundBtnEl.onclick = () => {
        soundOn = !soundOn;
        soundBtnEl.innerText = soundOn ? "🔊 Sound: ON" : "🔇 Sound: OFF";
        soundBtnEl.style.background = soundOn ? "#17a2b8" : "#6c757d";
        if (soundOn) playBeep();
      };
    }


    if (autoSubmitBtnEl) {
      autoSubmitBtnEl.onclick = () => {
        autoSubmitOn = !autoSubmitOn;
        autoSubmitBtnEl.innerText = autoSubmitOn
          ? "🟢 Auto Submit: ON"
          : "⚪ Auto Submit: OFF";
        autoSubmitBtnEl.style.background = autoSubmitOn ? "#28a745" : "#6c757d";

        // dùng element đã chèn ngay dưới nút Auto Submit
        const delayInput = document.getElementById("__autoReply_delayInput");
        if (delayInput) delayInput.style.display = autoSubmitOn ? "block" : "none";

        if (autoSubmitOn) {
          checkInterval = setInterval(() => {
            const submitBtn = [...document.querySelectorAll("button")].find(
              b => b.textContent.trim() === "Submit"
            );
            if (!submitBtn) return;
            if (!submitBtn.disabled && !pendingTimeout) {
              const delayInputEl = document.getElementById("__autoReply_delayInput");
              const maxDelay = Math.max(1, parseInt(delayInputEl?.value) || 10);
              const randomDelay = Math.random() * maxDelay * 1000;
              let remain = Math.floor(randomDelay / 1000);
              if (countdownTextEl) {
                countdownTextEl.style.display = "block";
                countdownTextEl.innerText = `🕒 Auto submit sau ${remain}s`;
              }

              clearInterval(countdownTimer);
              countdownTimer = setInterval(() => {
                remain--;
                if (remain > 0) {
                  if (countdownTextEl) countdownTextEl.innerText = `🕒 Auto submit sau ${remain}s`;
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
                if (countdownTextEl) countdownTextEl.style.display = "none";
              }, randomDelay);
            }
          }, 1000);
        } else {
          clearInterval(checkInterval);
          clearInterval(countdownTimer);
          if (pendingTimeout) clearTimeout(pendingTimeout);
          if (countdownTextEl) countdownTextEl.style.display = "none";
          pendingTimeout = null;
        }
      };
    }

    // 🆕 phần delayInput: lấy element đã chèn trong UI (nằm ngay dưới nút Auto Submit)
    const delayInput = document.getElementById("__autoReply_delayInput") || (function () {
      const el = document.createElement("input");
      el.type = "number";
      el.min = 1;
      el.value = 10;
      el.placeholder = "Auto Submit Delay (giây)";
      Object.assign(el.style, {
        width: "100%",
        padding: "8px 6px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "13px",
        display: "none",
        marginTop: "8px"
      });
      const root = document.getElementById("__autoReply_card");
      if (root) root.appendChild(el);
      return el;
    })();

    // 🔑 Phím OFF V: ON / OFF Auto Mode
    document.addEventListener("keydown", (e) => {
      // Keydown click submit
      if (e.key.toLowerCase() === "q") {
        e.preventDefault();
        clickSubmitAction();
      }

      // Keydown next review
      if (e.key.toLowerCase() === "w" || e.key.toLowerCase() === "ư") {
        // Ngăn chặn hành vi mặc định nếu cần
        e.preventDefault();
        // Gọi hàm backup
        triggerBackup(true);
      }

      // Keydown auto
      if (e.key.toLowerCase() === "e") {
        // tránh bấm khi đang gõ trong input / textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        e.preventDefault();
        const autoBtn = document.getElementById("__autoReply_autoMode");
        if (autoBtn) autoBtn.click();
      }

      // Keydown show/hide
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        const root = document.getElementById("__autoReply_root");
        if (!root) return;
        const isHidden = root.style.display === "none";
        root.style.display = isHidden ? "flex" : "none";
      }
    });


    // khởi tạo hiển thị counter
    updateCountUI();

    // Nếu người reload UI nhiều lần: cho phép reset counters nếu cần
    // Không tự reset repliedCount khi load lại để giữ số liệu nếu người muốn.
  })();