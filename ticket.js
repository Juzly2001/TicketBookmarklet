(function() {

    // ==========================
    // HÀM HỖ TRỢ
    // ==========================
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const getDelay = () => {
        const el = document.getElementById("delayInput");
        return Math.max(50, parseInt(el?.value || "200", 10));
    };

    async function selectDropdownChooseFirst(labelText, optionText) {
        const label = [...document.querySelectorAll(".fd-ticket-col label")]
            .find(l => l.innerText.trim().startsWith(labelText));
        if (!label) {
            console.warn("❗Không tìm thấy label", labelText);
            return false;
        }
        const col = label.closest(".fd-ticket-col");
        const trigger = col.querySelector(".ember-basic-dropdown-trigger");
        if (!trigger) {
            console.warn("❗Không tìm thấy trigger cho", labelText);
            return false;
        }

        ["mousedown", "mouseup", "click"].forEach(evt =>
            trigger.dispatchEvent(new MouseEvent(evt, {
                bubbles: true
            }))
        );

        await sleep(getDelay());

        const searchInput = document.querySelector(".ember-power-select-search-input");
        if (!searchInput) {
            console.warn("⚠️ Không tìm thấy ô search cho", labelText);
            return false;
        }

        searchInput.focus();
        searchInput.value = optionText || "";
        searchInput.dispatchEvent(new Event("input", {
            bubbles: true
        }));

        await sleep(getDelay());

        const opt = document.querySelector(".ember-power-select-option");
        if (!opt) {
            console.warn(`❗Không tìm thấy option cho "${labelText}"`);
            return false;
        }

        ["mousedown", "mouseup", "click"].forEach(evt =>
            opt.dispatchEvent(new MouseEvent(evt, {
                bubbles: true
            }))
        );
        return true;
    }

    // ==========================
    // TẠO MINI-EXCEL (1 BẢNG)
    // ==========================
    const OLD = document.getElementById("mini-excel-tool");
    if (OLD) OLD.remove();

    const box = document.createElement("div");
    box.id = "mini-excel-tool";
    box.style.cssText = `
    position:fixed;
    top:40px; left:40px;
    z-index:99999;
    background:#fdfdfd;
    border:1px solid #ccc;
    border-radius:10px;
    padding:12px 12px 70px 12px;
    box-shadow:0 6px 18px rgba(0,0,0,0.2);
    font-family:Segoe UI, Arial, sans-serif;
    font-size:13px;
    min-width:640px;
    min-height:340px;
    width:640px;     /* bắt buộc width */
    height:340px;    /* bắt buộc height */
    box-sizing:border-box;  /* ✅ quan trọng */
    transition:all .2s ease;
    resize:both;
    overflow:auto;
`;


    box.innerHTML = `
    <style>
      #mini-excel-table, #mini-excel-table th, #mini-excel-table td, #mini-excel-table input { box-sizing: border-box; }
      #mini-excel-table thead th { position: sticky; top: 0; background: #4285f4; color: #fff; z-index: 10; }
      #mini-excel-table td input { width: 100%; border: 1px solid #bbb; padding: 4px; border-radius: 4px; background: #fff; }
      #mini-excel-scroll { width: 100%; overflow-y: auto; }
    </style>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong style="font-size:15px;">⚡ Ticket Tool ~ Hide/Show (Ctrl + X)</strong>
      <div>
        <button id="importExcelBtn" style="margin-right:6px;padding:2px 8px;border-radius:5px;border:1px solid #999;background:#eee;cursor:pointer;">Import Excel</button>
        <button id="toggleViewBtn" style="margin-right:6px;padding:2px 8px;border-radius:5px;border:1px solid #999;background:#eee;cursor:pointer;display:none;">Ẩn (Ctrl + X)</button>
        <button id="resetTableBtn" style="margin-right:6px;padding:2px 8px;border-radius:5px;border:1px solid #999;background:#eee;cursor:pointer;">Reset Table</button>
        <button id="Resolve" style="margin-right:6px;padding:2px 8px;border-radius:5px;border:1px solid #999;background:#eee;cursor:pointer;">Resolve</button>
        <button id="closeMiniExcel" style="background:transparent;border:none;font-size:18px;cursor:pointer;">✖</button>
      </div>
    </div>

    <div style="border:1px solid #ccc;border-radius:6px;overflow:hidden;">
      <div id="mini-excel-scroll">
        <table id="mini-excel-table" style="width:100%;border-collapse:collapse;table-layout:fixed;">
          <colgroup>
            <col style="width:26%;">
            <col style="width:22%;">
            <col style="width:18%;">
            <col style="width:18%;"> <!-- GROUP -->
            <col style="width:8%;">
            <col style="width:8%;">
          </colgroup>
          <thead>
            <tr>
              <th style="padding:6px;border:1px solid #ccc;text-align:left;">YÊU CẦU</th>
              <th style="padding:6px;border:1px solid #ccc;text-align:left;">CHI TIẾT VẤN ĐỀ</th>
              <th style="padding:6px;border:1px solid #ccc;text-align:left;">ĐỐI TÁC</th>
              <th style="padding:6px;border:1px solid #ccc;text-align:left;">GROUP</th>
              <th style="padding:6px;border:1px solid #ccc;text-align:center;">Do</th>
              <th style="padding:6px;border:1px solid #ccc;text-align:center;">Del</th>
            </tr>
          </thead>
          <tbody id="mini-excel-body">
            <tr>
              <td style="border:1px solid #ccc;padding:4px;"><input value="Others"></td>
              <td style="border:1px solid #ccc;padding:4px;"><input value="No support"></td>
              <td style="border:1px solid #ccc;padding:4px;"><input value="None"></td>
              <td style="border:1px solid #ccc;padding:4px;"><input value="Fanpage"></td>
              <td style="border:1px solid #ccc;text-align:center;"><button class="doAction" style="padding:4px 8px;border-radius:4px;border:1px solid #4285f4;background:#4285f4;color:#fff;cursor:pointer;">▶</button></td>
              <td style="border:1px solid #ccc;text-align:center;"><button class="deleteRow" style="padding:4px 8px;border-radius:4px;border:1px solid #d33;background:#d33;color:#fff;cursor:pointer;">🗑️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
      <button id="addRowBtn" style="padding:4px 12px;border-radius:5px;border:1px solid #28a745;background:#28a745;color:#fff;cursor:pointer;">+ Add row</button>
      <label>Resolved:
        <input id="resolved" type="number" value="0" style="width:80px;padding:4px;border:1px solid #bbb;border-radius:5px;text-align:right;" disabled>
      </label>
      <label>Delay(ms):
        <input id="delayInput" type="number" min="50" value="0" style="width:80px;padding:4px;border:1px solid #bbb;border-radius:5px;text-align:right;">
      </label>
      <label>Subject:
        <input id="subjectInput" style="width:150px;padding:4px;border:1px solid #bbb;border-radius:5px;" value="PhuongNt32">
      </label>
      <label>Width(px):
        <input id="widthInput" type="number" style="width:80px;padding:4px;border:1px solid #bbb;border-radius:5px;text-align:right;" value="64 0">
      </label>
      <label>Height(px):
        <input id="heightInput" type="number" style="width:80px;padding:4px;border:1px solid #bbb;border-radius:5px;text-align:right;" value="340">
      </label>
    </div>
  `;

    document.body.appendChild(box);
    // ==========================
    // IMPORT EXCEL XLSX
    // ==========================
    const excelInput = document.createElement("input");
    excelInput.type = "file";
    excelInput.accept = ".xlsx,.xls";
    excelInput.style.display = "none";
    document.body.appendChild(excelInput);

    document.getElementById("importExcelBtn").onclick = () => excelInput.click();

    excelInput.onchange = async e => {
        const file = e.target.files[0];
        if (!file) return;

        // Load SheetJS library nếu chưa có
        if (!window.XLSX) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js";
            script.onload = () => processExcel(file);
            document.head.appendChild(script);
        } else {
            processExcel(file);
        }

        function processExcel(file) {
            const reader = new FileReader();
            reader.onload = evt => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, {
                    type: "array"
                });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1
                });
                const tbody = document.getElementById("mini-excel-body");

                json.forEach(row => {
                    const [yeuCau, chiTiet, doiTac, group] = row;
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
            <td style="border:1px solid #ccc;padding:4px;"><input value="${yeuCau||''}"></td>
            <td style="border:1px solid #ccc;padding:4px;"><input value="${chiTiet||''}"></td>
            <td style="border:1px solid #ccc;padding:4px;"><input value="${doiTac||''}"></td>
            <td style="border:1px solid #ccc;padding:4px;"><input value="${group ||''}"></td>
            <td style="border:1px solid #ccc;text-align:center;"><button class="doAction" style="padding:4px 8px;border-radius:4px;border:1px solid #4285f4;background:#4285f4;color:#fff;cursor:pointer;">▶</button></td>
            <td style="border:1px solid #ccc;text-align:center;"><button class="deleteRow" style="padding:4px 8px;border-radius:4px;border:1px solid #d33;background:#d33;color:#fff;cursor:pointer;">🗑️</button></td>
          `;
                    tbody.appendChild(tr);
                });
                updateTbodyHeight();
            };
            reader.readAsArrayBuffer(file);
        }
    };


    // ==========================
    // KÍCH THƯỚC BOX
    // ==========================
    const widthInput = document.getElementById("widthInput");
    const heightInput = document.getElementById("heightInput");

    function updateBoxSize() {
        box.style.width = widthInput.value + "px";
        box.style.height = heightInput.value + "px";
        setTimeout(updateTbodyHeight, 30);
    }

    widthInput.addEventListener("input", updateBoxSize);
    heightInput.addEventListener("input", updateBoxSize);

    new ResizeObserver(() => {
        widthInput.value = box.offsetWidth;
        heightInput.value = box.offsetHeight;
        updateTbodyHeight();
    }).observe(box);

    // ==========================
    // GIỚI HẠN 8 DÒNG (1 TABLE + sticky header)
    // ==========================
    const maxVisibleRows = 8;
    const scrollContainer = document.getElementById("mini-excel-scroll");
    const table = document.getElementById("mini-excel-table");
    const miniBody = document.getElementById("mini-excel-body");

    function updateTbodyHeight() {
        const rows = miniBody.querySelectorAll("tr");
        const rowCount = rows.length;
        if (rowCount === 0) {
            scrollContainer.style.maxHeight = "0px";
            return;
        }

        // đo chiều cao header và 1 hàng thực tế
        const header = table.querySelector("thead");
        const headerRect = header.getBoundingClientRect();
        const headerH = headerRect.height || 0;

        // chọn 1 hàng làm chuẩn (nếu bạn có hàng cao hơn do wrap text, có thể lấy max của vài hàng)
        const firstRowRect = rows[0].getBoundingClientRect();
        const rowH = Math.max(24, firstRowRect.height); // fallback min 24

        const visibleRows = Math.min(rowCount, maxVisibleRows);
        // tổng chiều cao = header + visibleRows * rowH
        const totalH = Math.round(headerH + visibleRows * rowH);

        scrollContainer.style.maxHeight = totalH + "px";
        scrollContainer.style.overflowY = rowCount > maxVisibleRows ? "auto" : "hidden";
    }

    // observer thay đổi số lượng hàng
    const observer = new MutationObserver(updateTbodyHeight);
    observer.observe(miniBody, {
        childList: true,
        subtree: false
    });
    window.addEventListener("resize", updateTbodyHeight);
    updateTbodyHeight();

    // ==========================
    // EVENTS: add/delete/click
    // ==========================
    document.getElementById("closeMiniExcel").onclick = () => box.remove();

    const toggleBtn = document.getElementById("toggleViewBtn");
    let hiddenState = false;
    toggleBtn.onclick = () => {
        hiddenState = !hiddenState;
        document.querySelector("#mini-excel-table").style.display = hiddenState ? "none" : "";
        document.getElementById("addRowBtn").style.display = hiddenState ? "none" : "";
        document.getElementById("delayInput").parentElement.style.display = hiddenState ? "none" : "";
        document.getElementById("subjectInput").parentElement.style.display = hiddenState ? "none" : "";
        widthInput.parentElement.style.display = hiddenState ? "none" : "";
        heightInput.parentElement.style.display = hiddenState ? "none" : "";
        toggleBtn.innerText = hiddenState ? "Hiện" : "Ẩn";
    };

    document.getElementById("addRowBtn").onclick = () => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td style="border:1px solid #ccc;padding:4px;"><input placeholder=""></td>
      <td style="border:1px solid #ccc;padding:4px;"><input placeholder=""></td>
      <td style="border:1px solid #ccc;padding:4px;"><input placeholder=""></td>
      <td style="border:1px solid #ccc;padding:4px;"><input placeholder=""></td>
      <td style="border:1px solid #ccc;text-align:center;"><button class="doAction" style="padding:4px 8px;border-radius:4px;border:1px solid #4285f4;background:#4285f4;color:#fff;cursor:pointer;">▶</button></td>
      <td style="border:1px solid #ccc;text-align:center;"><button class="deleteRow" style="padding:4px 8px;border-radius:4px;border:1px solid #d33;background:#d33;color:#fff;cursor:pointer;">🗑️</button></td>
    `;
        miniBody.appendChild(tr);
        updateTbodyHeight();
    };

    box.addEventListener("click", async e => {
        if (e.target.classList.contains("doAction")) {
            try {
                // ====== Đoạn 1: Click Resolve & Create Ticket In Freshdesk ======
                await new Promise(resolve => {
                    const btn = document.querySelector('.split-button.resolve-action.custom-split-dropdown[role="button"]');
                    if (!btn) {
                        alert('❌ Không tìm thấy nút dropdown Resolve');
                        resolve();
                        return;
                    }

                    btn.click();

                    const simulateClick = (el) => ['mousedown', 'mouseup', 'click'].forEach(evt => {
                        el.dispatchEvent(new MouseEvent(evt, {
                            bubbles: true
                        }));
                    });

                    const trySelect = () => {
                        const options = document.querySelectorAll('.ember-power-select-option');
                        for (const opt of options) {
                            if (opt.innerText.replace(/\s+/g, ' ').trim().toLowerCase() === 'resolve and create ticket in freshdesk') {
                                simulateClick(opt);
                                return true;
                            }
                        }
                        return false;
                    };

                    let tries = 0;
                    const timer = setInterval(() => {
                        tries++;
                        if (trySelect() || tries > 50) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 200);
                });

                // ====== Đoạn 2: Chờ đủ label trước khi chọn dropdown ======
                const tr = e.target.closest("tr");
                const yeuCau = tr.children[0].querySelector("input").value.trim();
                const chiTiet = tr.children[1].querySelector("input").value.trim();
                const doiTac = tr.children[2].querySelector("input").value.trim();
                const group = tr.children[3].querySelector("input").value.trim();
                const subjVal = document.getElementById("subjectInput").value.trim() || "PhuongNt32";

                const waitForLabel = async (labelText, timeout = 5000) => {
                    const interval = 100;
                    let elapsed = 0;
                    while (elapsed < timeout) {
                        const label = [...document.querySelectorAll(".fd-ticket-col label")]
                            .find(l => l.innerText.trim().startsWith(labelText));
                        if (label) return label;
                        await new Promise(r => setTimeout(r, interval));
                        elapsed += interval;
                    }
                    return null;
                };

                await waitForLabel("Yêu cầu");
                await waitForLabel("Chi tiết vấn đề");
                await waitForLabel("Đối tác");
                await waitForLabel("Group");

                const subj = document.querySelector("#Subject");
                if (subj) {
                    subj.value = subjVal;
                    subj.dispatchEvent(new Event("input", {
                        bubbles: true
                    }));
                }

                await selectDropdownChooseFirst("Yêu cầu", yeuCau);
                await selectDropdownChooseFirst("Chi tiết vấn đề", chiTiet);
                await selectDropdownChooseFirst("Đối tác", doiTac);
                await selectDropdownChooseFirst("Group", group);

            } finally {
                // 💡 Đặt ở đây đảm bảo chỉ clear sau khi xong (kể cả có lỗi vẫn chạy)
                console.clear();
            }
        }

        if (e.target.classList.contains("deleteRow")) {
            e.target.closest("tr").remove();
            updateTbodyHeight();
        }
    });

    // tránh gắn sự kiện nhiều lần (Resolve)
    if (window.__resolveBound) return;
    window.__resolveBound = true;

    document.addEventListener("click", function(e) {
        if (e.target.closest("#Resolve")) {
            var realBtn = document.querySelector(".split-button-resolve");
            if (realBtn) {
                realBtn.click();
                console.log("Custom Resolve clicked → Real Resolve triggered");
            }
        }
    });

    // Resolved
    const input = document.getElementById('resolved');
    if(!input) return;

    const btn = document.querySelector('button[aria-label="Resolve and create ticket"]');
    if(!btn) return;

    btn.addEventListener('click', function(){
        const current = parseInt(input.value || '0', 10);
        input.value = current + 1;
    });


    document.getElementById("resetTableBtn").onclick = () => {
        const tbody = document.getElementById("mini-excel-body");
        tbody.innerHTML = ""; // xóa tất cả row hiện tại

        // Tạo lại 1 row mặc định nếu muốn
        const tr = document.createElement("tr");
        tr.innerHTML = `
    <td style="border:1px solid #ccc;padding:4px;"><input value="Thanh toán"></td>
    <td style="border:1px solid #ccc;padding:4px;"><input value="Kiểm tra giao dịch"></td>
    <td style="border:1px solid #ccc;padding:4px;"><input value="None"></td>
    <td style="border:1px solid #ccc;padding:4px;"><input value="Fanpage"></td>
    <td style="border:1px solid #ccc;text-align:center;"><button class="doAction" style="padding:4px 8px;border-radius:4px;border:1px solid #4285f4;background:#4285f4;color:#fff;cursor:pointer;">▶</button></td>
    <td style="border:1px solid #ccc;text-align:center;"><button class="deleteRow" style="padding:4px 8px;border-radius:4px;border:1px solid #d33;background:#d33;color:#fff;cursor:pointer;">🗑️</button></td>
  `;
        tbody.appendChild(tr);

        updateTbodyHeight(); // cập nhật chiều cao scroll
    };


    document.addEventListener("keydown", e => {
        if (e.ctrlKey && e.key.toLowerCase() === "x") {
            box.style.display = (box.style.display === "none" ? "block" : "none");
        }
    });
    (function enableDrag(el) {
        let offsetX = 0,
            offsetY = 0,
            isDown = false,
            startX = 0,
            startY = 0;

        const header = el.querySelector("div"); // header đầu tiên
        header.style.cursor = "move";

        header.addEventListener("mousedown", e => {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = el.getBoundingClientRect();
            offsetX = rect.left;
            offsetY = rect.top;
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mouseup", () => {
            isDown = false;
            document.body.style.userSelect = "";
        });

        document.addEventListener("mousemove", e => {
            if (!isDown) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            el.style.transform = `translate(${offsetX + dx}px, ${offsetY + dy}px)`;
        });
    })(box);

})();