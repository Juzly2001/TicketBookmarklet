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
            // clear fallback timer khi đã thực sự lưu được phản hồi
            if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
            }
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
        if (startBtn) startBtn.innerText = "➡️ Backup chuyển sang review kế tiếp";

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
            if (startBtn) startBtn.innerText = "➡️ Sang review kế tiếp";
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

    // === NEW: nút Backup trên UI ===
    const backupBtn = document.createElement("button");
    backupBtn.id = "__autoReply_backup";
    backupBtn.innerText = "Backup (Bỏ & Sang tiếp)";
    Object.assign(backupBtn.style, {
        padding: "10px 12px",
        background: "#ff6b6b",
        color: "white",
        fontSize: "14px",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)"
    });
    // gắn vào root nếu root tồn tại
    const rootEl = document.getElementById("__autoReply_root");
    if (rootEl) {
        rootEl.appendChild(backupBtn);
    }
    backupBtn.onclick = () => {
        triggerBackup(true);
    };

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

    /* === 🧠 AUTO SUBMIT: delay ngẫu nhiên từ 0 đến số nhập === */
    let autoSubmitOn = false;
    let checkInterval = null;
    let pendingTimeout = null;
    let countdownTimer = null;
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

    // 🆕 Ô nhập delay
    const delayInput = document.createElement("input");
    delayInput.type = "number";
    delayInput.min = 1;
    delayInput.value = 10;
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

    autoSubmitBtn.onclick = () => {
        autoSubmitOn = !autoSubmitOn;
        autoSubmitBtn.innerText = autoSubmitOn
        ? "🟢 Auto Submit: BẬT"
        : "⚪ Auto Submit: TẮT";
        autoSubmitBtn.style.background = autoSubmitOn ? "#28a745" : "#6c757d";
        delayInput.style.display = autoSubmitOn ? "block" : "none";

        if (autoSubmitOn) {
        checkInterval = setInterval(() => {
            const submitBtn = [...document.querySelectorAll("button")].find(
            b => b.textContent.trim() === "Submit"
            );
            if (!submitBtn) return;
            if (!submitBtn.disabled && !pendingTimeout) {
            const maxDelay = Math.max(1, parseInt(delayInput.value) || 10);
            const randomDelay = Math.random() * maxDelay * 1000;
            let remain = Math.floor(randomDelay / 1000);
            countdownText.style.display = "block";
            countdownText.innerText = `🕒 Auto submit sau ${remain}s`;

            clearInterval(countdownTimer);
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
            }, randomDelay);
            }
        }, 1000);
        } else {
        clearInterval(checkInterval);
        clearInterval(countdownTimer);
        if (pendingTimeout) clearTimeout(pendingTimeout);
        countdownText.style.display = "none";
        pendingTimeout = null;
        }
    };
    })();