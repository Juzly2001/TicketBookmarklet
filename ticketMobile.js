(function(){
  // ==========================
  // Helper (giữ nguyên logic dropdown)
  // ==========================
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const getDelay = () => {
    const el = document.getElementById("delayInput");
    return Math.max(50, parseInt(el?.value || "200",10));
  };

  async function selectDropdownChooseFirst(labelText, optionText) {
    const label = [...document.querySelectorAll(".fd-ticket-col label")]
                    .find(l => l.innerText.trim().startsWith(labelText));
    if (!label) { console.warn("❗Không tìm thấy label", labelText); return false; }
    const col = label.closest(".fd-ticket-col");
    const trigger = col.querySelector(".ember-basic-dropdown-trigger");
    if (!trigger) { console.warn("❗Không tìm thấy trigger cho", labelText); return false; }

    ["mousedown","mouseup","click"].forEach(evt =>
      trigger.dispatchEvent(new MouseEvent(evt,{bubbles:true}))
    );

    await sleep(getDelay());

    const searchInput = document.querySelector(".ember-power-select-search-input");
    if (!searchInput) { console.warn("⚠️ Không tìm thấy ô search cho", labelText); return false; }

    searchInput.focus();
    searchInput.value = optionText || "";
    searchInput.dispatchEvent(new Event("input",{bubbles:true}));

    await sleep(getDelay());

    const opt = document.querySelector(".ember-power-select-option");
    if (!opt) {
      console.warn(`❗Không tìm thấy option cho "${labelText}"`);
      return false;
    }

    ["mousedown","mouseup","click"].forEach(evt =>
      opt.dispatchEvent(new MouseEvent(evt,{bubbles:true}))
    );
    return true;
  }

  // ==========================
  // Remove previous instances
  // ==========================
  const OLD = document.getElementById("mini-excel-tool");
  if (OLD) OLD.remove();
  const OLD_BTN = document.getElementById("mini-excel-slide-btn");
  if (OLD_BTN) OLD_BTN.remove();
  const OLD_OVERLAY = document.getElementById("mini-excel-overlay");
  if (OLD_OVERLAY) OLD_OVERLAY.remove();

  // ==========================
  // Create sidebar (left sticky) - keep original UI/CSS
  // ==========================
  const box = document.createElement("aside");
  box.id = "mini-excel-tool";
  box.setAttribute("role","dialog");
  box.setAttribute("aria-hidden","true");
  box.style.cssText = `
    position:fixed;
    top:0;
    left:0;
    z-index:100000;
    background:#fff;
    border-right:1px solid #e6e6e6;
    box-shadow:2px 0 18px rgba(0,0,0,0.12);
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    font-size:15px;
    width:88vw;
    max-width:420px;
    height:100vh;
    box-sizing:border-box;
    transform:translateX(-100%);
    transition:transform .32s cubic-bezier(.2,.9,.2,1), opacity .25s ease;
    opacity:0;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    -webkit-tap-highlight-color: transparent;
  `;

  box.innerHTML = `
    <style>
      /* ensure inputs/buttons >=16px to avoid iOS zoom */
      #mini-excel-tool input, #mini-excel-tool button, #mini-excel-tool select, #mini-excel-tool textarea { font-size:16px; -webkit-font-smoothing:antialiased; }
      .mx-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid #f2f2f2; gap:8px; }
      .mx-title { font-weight:700; font-size:17px; display:flex; gap:8px; align-items:center; }
      .mx-close { background:transparent;border:none;font-size:20px;cursor:pointer;padding:6px; color:#333; }
      .mx-body { padding:12px 14px; overflow:auto; -webkit-overflow-scrolling:touch; flex:1 1 auto; }
      /* Table base - we'll hide header on mobile and render rows as cards */
      #mini-excel-table { width:100%; border-collapse:collapse; table-layout:fixed; }
      #mini-excel-table thead th { background:#0d6efd; color:#fff; padding:10px; text-align:left; font-weight:700; border-radius:4px; }
      #mini-excel-table thead { display:none; } /* not needed for card layout */
      #mini-excel-table tbody { display:block; padding:0; margin:0; }
      /* each row as card */
      #mini-excel-table tbody tr {
        display:flex;
        flex-direction:column;
        gap:10px;
        padding:12px;
        margin-bottom:12px;
        border-radius:12px;
        background:#fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.04);
        border:1px solid #f3f3f3;
        box-sizing:border-box;
      }
      #mini-excel-table td { display:block; padding:0; }
      .mx-field-label { display:block; font-size:13px; color:#444; margin-bottom:6px; }
      #mini-excel-table td input { width:100%; padding:10px; border:1px solid #e0e0e0; border-radius:8px; background:#fff; box-sizing:border-box; }
      .mx-controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:8px; }
      .btn { padding:10px 14px; border-radius:10px; border:1px solid #bdbdbd; background:#f7f7f7; cursor:pointer; font-size:16px; }
      .btn-primary { background:#0d6efd; color:#fff; border-color:#0d6efd; }
      .btn-danger { background:#d9534f; color:#fff; border-color:#d9534f; }
      /* grouped actions (Run + Del) stay horizontal */
      .row-actions { display:flex; gap:10px; margin-top:4px; }
      .row-actions .action-btn { flex:1; padding:12px 10px; border-radius:10px; font-size:16px; cursor:pointer; text-align:center; border:none; }
      .row-actions .action-btn.btn-primary { background:#0d6efd; color:#fff; }
      .row-actions .action-btn.btn-danger { background:#d9534f; color:#fff; }
      /* compact row (horizontal) for saved state */
      .compact-row { display:flex; gap:8px; align-items:center; }
      .compact-cell { flex:1; font-size:15px; color:#222; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .compact-actions { display:flex; gap:8px; min-width:120px; justify-content:flex-end; }
      /* scroll container */
      #mini-excel-scroll { width:100%; overflow-y:auto; -webkit-overflow-scrolling:touch; }
      /* ensure body spacing when keyboard opens on mobile */
      @media (max-width:420px){
        #mini-excel-tool { width:96vw; max-width:380px; }
      }
    </style>

    <div class="mx-header">
      <div class="mx-title">⚡ Ticket Tool <span style="font-weight:400;font-size:13px;color:#666;margin-left:6px;">(Mobile)</span></div>
      <div><button id="mini-close-top" class="mx-close" aria-label="Close">✖</button></div>
    </div>

    <div class="mx-body" id="mini-body">
      <div id="mini-excel-scroll" role="region" aria-label="Rows container">
        <table id="mini-excel-table" aria-describedby="ticket-help">
          <thead>
            <tr>
              <th>YÊU CẦU</th><th>CHI TIẾT</th><th>ĐỐI TÁC</th><th>Action</th><th>Del</th>
            </tr>
          </thead>
          <tbody id="mini-excel-body">
            <!-- initial sample row (kept as inputs) -->
            <tr>
              <td colspan="3">
                <div class="compact-row">
                  <div class="compact-cell" title="a">Others</div>
                  <div class="compact-cell" title="a">Chưa rõ yêu cầu</div>
                  <div class="compact-cell" title="a">None</div>
                  <div class="compact-actions">
                    <button class="doAction action-btn btn-primary" title="Run">▶</button>
                    <button class="deleteRow action-btn btn-danger" title="Delete">🗑</button>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <div class="compact-row">
                  <div class="compact-cell" title="a">Thanh toán</div>
                  <div class="compact-cell" title="a">Kiểm tra giao dịch</div>
                  <div class="compact-cell" title="a">None</div>
                  <div class="compact-actions">
                    <button class="doAction action-btn btn-primary" title="Run">▶</button>
                    <button class="deleteRow action-btn btn-danger" title="Delete">🗑</button>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <div class="compact-row">
                  <div class="compact-cell" title="a">Khuyến mãi</div>
                  <div class="compact-cell" title="a">Thể lệ chương trình</div>
                  <div class="compact-cell" title="a">None</div>
                  <div class="compact-actions">
                    <button class="doAction action-btn btn-primary" title="Run">▶</button>
                    <button class="deleteRow action-btn btn-danger" title="Delete">🗑</button>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <div class="compact-row">
                  <div class="compact-cell" title="a">Tài khoản</div>
                  <div class="compact-cell" title="a">Tư vấn sử dụng</div>
                  <div class="compact-cell" title="a">None</div>
                  <div class="compact-actions">
                    <button class="doAction action-btn btn-primary" title="Run">▶</button>
                    <button class="deleteRow action-btn btn-danger" title="Delete">🗑</button>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="3">
                <div class="compact-row">
                  <div class="compact-cell" title="a">Tài khoản</div>
                  <div class="compact-cell" title="a">Tư vấn sử dụng</div>
                  <div class="compact-cell" title="a">Pay later</div>
                  <div class="compact-actions">
                    <button class="doAction action-btn btn-primary" title="Run">▶</button>
                    <button class="deleteRow action-btn btn-danger" title="Delete">🗑</button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mx-controls" style="margin-top:12px;">
        <button id="addRowBtn" class="btn btn-primary">+ Add row</button>
        <label style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:15px;color:#333;">Delay(ms):</span>
          <input id="delayInput" type="number" min="50" value="0" style="width:88px;padding:8px;border-radius:8px;border:1px solid #ddd;text-align:right;">
        </label>
        <label style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:15px;color:#333;">Subject:</span>
          <input id="subjectInput" value="PhuongNt32" style="padding:8px;border-radius:8px;border:1px solid #ddd;">
        </label>
      </div>
    </div>
  `;

  document.body.appendChild(box);

  // ==========================
  // Overlay
  // ==========================
  const overlay = document.createElement("div");
  overlay.id = "mini-excel-overlay";
  overlay.style.cssText = `position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.28);opacity:0;transition:opacity .22s ease;pointer-events:none;`;
  document.body.appendChild(overlay);

  // ==========================
  // Slide button
  // ==========================
  const slideBtn = document.createElement("button");
  slideBtn.id = "mini-excel-slide-btn";
  slideBtn.innerText = "≡";
  slideBtn.setAttribute("aria-expanded","false");
  slideBtn.style.cssText = `
    position:fixed; top:16px; left:10px; z-index:100001;
    width:48px; height:48px; border-radius:50%; border:none;
    background:#0d6efd; color:#fff; font-size:22px; display:flex;
    align-items:center; justify-content:center; cursor:pointer;
    box-shadow:0 6px 18px rgba(0,0,0,0.16); transition:left .28s ease, transform .28s ease;
  `;
  document.body.appendChild(slideBtn);

  // disable/enable page scroll helpers
  function disablePageScroll(){ document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; }
  function enablePageScroll(){ document.documentElement.style.overflow = ''; document.body.style.overflow = ''; }

  let panelOpened = false;
  function openPanel(){
    slideBtn.style.display = "none";
    panelOpened = true;
    box.style.transform = "translateX(0)";
    box.style.opacity = "1";
    box.setAttribute("aria-hidden","false");
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    slideBtn.setAttribute("aria-expanded","true");
    const panelWidth = Math.min(window.innerWidth * 0.88, 420);
    slideBtn.style.left = (panelWidth - 44) + "px";
    slideBtn.style.transform = "rotate(90deg)";
      // Hiện nút X lại
  const closeBtn = document.getElementById("mini-close-top");
  closeBtn.style.display = "inline-flex"; // hoặc "flex"
  closeBtn.style.opacity = "1";
    disablePageScroll();
    // ensure scroll container height correct
    updateTbodyHeight();
  }
  function closePanel(){
    panelOpened = false;
    slideBtn.style.display = "block";
    box.style.transform = "translateX(-100%)";
    box.style.opacity = "0";
    box.setAttribute("aria-hidden","true");
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    slideBtn.setAttribute("aria-expanded","false");
    slideBtn.style.left = "10px";
    slideBtn.style.transform = "rotate(0deg)";
    enablePageScroll();
  }

  slideBtn.addEventListener("click", ()=> panelOpened ? closePanel() : openPanel());
  overlay.addEventListener("click", closePanel);
  document.getElementById("mini-close-top").addEventListener("click", ()=>{
  panelOpened = false;
  box.style.transform = "translateX(-100%)"; // trượt ra ngoài
  box.style.opacity = "0";                   // mờ đi
  box.setAttribute("aria-hidden","true");
  overlay.style.opacity = "0";               // overlay ẩn
  overlay.style.pointerEvents = "none";
  
  // Hiển thị lại nút slide
  slideBtn.style.display = "flex";
  slideBtn.style.left = "10px";
  slideBtn.style.transform = "rotate(0deg)";

  // Nút X cũng ẩn luôn
  document.getElementById("mini-close-top").style.display = "none";

  enablePageScroll(); // bật lại scroll trang
});


  window.addEventListener("resize", ()=> {
    if (panelOpened) {
      const panelWidth = Math.min(window.innerWidth * 0.88, 420);
      slideBtn.style.left = (panelWidth - 44) + "px";
      updateTbodyHeight();
    }
  });

  // ==========================
  // Scroll & height handling
  // ==========================
  const scrollContainer = document.getElementById("mini-excel-scroll");
  const table = document.getElementById("mini-excel-table");
  const miniBody = document.getElementById("mini-excel-body");

  function updateTbodyHeight(){
    // compute available height inside sidebar: sidebar height minus header and controls
    const headerEl = box.querySelector('.mx-header');
    const controlsEl = box.querySelector('.mx-controls');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 60;
    const controlsH = controlsEl ? controlsEl.getBoundingClientRect().height : 80;
    const available = Math.max(window.innerHeight - headerH - controlsH - 60, 200);
    scrollContainer.style.maxHeight = available + "px";
    scrollContainer.style.overflowY = "auto";
  }

  const observer = new MutationObserver(()=> {
    // slight delay to allow DOM layout
    setTimeout(updateTbodyHeight, 30);
  });
  observer.observe(miniBody, {childList:true, subtree:false});
  window.addEventListener("orientationchange", ()=> setTimeout(updateTbodyHeight,80));
  window.addEventListener("resize", ()=> setTimeout(updateTbodyHeight,80));
  updateTbodyHeight();

  // ==========================
  // Row template helper (INPUT mode)
  // ==========================
  function createRow({yeuCau='', chiTiet='', doiTac=''} = {}) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <label class="mx-field-label">Yêu cầu</label>
        <input placeholder="Yêu cầu" value="${escapeHtml(yeuCau)}">
      </td>
      <td>
        <label class="mx-field-label">Chi tiết</label>
        <input placeholder="Chi tiết" value="${escapeHtml(chiTiet)}">
      </td>
      <td>
        <label class="mx-field-label">Đối tác</label>
        <input placeholder="Đối tác" value="${escapeHtml(doiTac)}">
      </td>
      <td colspan="2">
        <div class="row-actions">
          <button class="saveRow action-btn btn-primary" title="Save">✓ Save</button>
          <button class="deleteRow action-btn btn-danger" title="Delete">🗑 Del</button>
        </div>
      </td>
    `;
    return tr;
  }

  // create compact (SAVED) row HTML using same outer tr element
  function makeCompactRow(tr, yeuCau, chiTiet, doiTac) {
    // replace content of tr with compact layout but keep tr element
    tr.innerHTML = `
      <td colspan="3">
        <div class="compact-row">
          <div class="compact-cell" title="${escapeHtml(yeuCau)}">${escapeHtml(yeuCau)}</div>
          <div class="compact-cell" title="${escapeHtml(chiTiet)}">${escapeHtml(chiTiet)}</div>
          <div class="compact-cell" title="${escapeHtml(doiTac)}">${escapeHtml(doiTac)}</div>
          <div class="compact-actions">
            <button class="doAction action-btn btn-primary" title="Run">▶</button>
            <button class="deleteRow action-btn btn-danger" title="Delete">🗑</button>
          </div>
        </div>
      </td>
    `;
  }

  // small helper to escape quotes for inserted values
  function escapeHtml(s){
    if (!s && s !== 0) return '';
    return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  }

  // ==========================
  // Events: add row
  // ==========================
  document.getElementById("addRowBtn").addEventListener("click", ()=> {
    const tr = createRow();
    miniBody.appendChild(tr);
    updateTbodyHeight();
    setTimeout(()=> {
      const lastInput = tr.querySelector("input");
      if (lastInput) lastInput.focus();
    }, 50);
  });

  // ==========================
  // Delegate click inside sidebar: Save, doAction & deleteRow
  // ==========================
  box.addEventListener("click", async e => {
    const target = e.target;

    // Save newly created row -> convert to compact horizontal row
    if (target.classList.contains("saveRow")) {
      const tr = target.closest("tr");
      if (!tr) return;
      const yeuCau = tr.children[0].querySelector("input")?.value.trim() || '';
      const chiTiet = tr.children[1].querySelector("input")?.value.trim() || '';
      const doiTac = tr.children[2].querySelector("input")?.value.trim() || '';
      makeCompactRow(tr, yeuCau, chiTiet, doiTac);
      updateTbodyHeight();
      return;
    }

    // Run (doAction) - works for both input-mode (if someone left inputs) and compact-mode
    if (target.classList.contains("doAction")){
      try {
        // Part 1: click Resolve dropdown (unchanged)
        await new Promise(resolve => {
          const btn = document.querySelector('.split-button.resolve-action.custom-split-dropdown[role="button"]');
          if (!btn) { alert('❌ Không tìm thấy nút dropdown Resolve'); resolve(); return; }
          btn.click();
          const simulateClick = (el) => ['mousedown','mouseup','click'].forEach(evt=>{
            el.dispatchEvent(new MouseEvent(evt,{bubbles:true}));
          });
          const trySelect = () => {
            const options = document.querySelectorAll('.ember-power-select-option');
            for(const opt of options){
              if(opt.innerText.replace(/\s+/g,' ').trim().toLowerCase() === 'resolve and create ticket in freshdesk'){
                simulateClick(opt);
                return true;
              }
            }
            return false;
          };
          let tries=0;
          const timer = setInterval(()=>{
            tries++;
            if(trySelect() || tries>50){ clearInterval(timer); resolve(); }
          },200);
        });

        // Part 2: fill labels/dropdowns (adapted: support compact row layout)
        const tr = target.closest("tr");
        if (!tr) return;

        // get values: if inputs exist read them, else read compact-cell text
        let yeuCau='', chiTiet='', doiTac='';
        const inputs = tr.querySelectorAll("input");
        if (inputs && inputs.length >= 3) {
          yeuCau = inputs[0].value.trim();
          chiTiet = inputs[1].value.trim();
          doiTac = inputs[2].value.trim();
        } else {
          // compact mode: cells are inside .compact-cell (3 of them)
          const cells = tr.querySelectorAll(".compact-cell");
          yeuCau = cells[0]?.textContent.trim() || '';
          chiTiet = cells[1]?.textContent.trim() || '';
          doiTac = cells[2]?.textContent.trim() || '';
        }

        const subjVal = document.getElementById("subjectInput").value.trim() || "PhuongNt32";

        const waitForLabel = async (labelText, timeout = 5000) => {
          const interval = 100;
          let elapsed = 0;
          while(elapsed < timeout){
            const label = [...document.querySelectorAll(".fd-ticket-col label")]
                            .find(l => l.innerText.trim().startsWith(labelText));
            if(label) return label;
            await new Promise(r=>setTimeout(r, interval));
            elapsed += interval;
          }
          return null;
        };

        await waitForLabel("Yêu cầu");
        await waitForLabel("Chi tiết vấn đề");
        await waitForLabel("Đối tác");

        const subj = document.querySelector("#Subject");
        if(subj){
          subj.value = subjVal;
          subj.dispatchEvent(new Event("input",{bubbles:true}));
        }

        await selectDropdownChooseFirst("Yêu cầu", yeuCau);
        await selectDropdownChooseFirst("Chi tiết vấn đề", chiTiet);
        await selectDropdownChooseFirst("Đối tác", doiTac);

      } finally {
        console.clear();
      }
    }

    // Delete row (works both for input-mode and compact-mode)
    if (target.classList.contains("deleteRow")){
      const tr = target.closest("tr");
      if (tr) tr.remove();
      updateTbodyHeight();
    }
  });

  // ==========================
  // Ctrl+X to toggle panel
  // ==========================
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key.toLowerCase() === "x") {
      panelOpened ? closePanel() : openPanel();
    }
  });

  // ==========================
  // Start closed
  // ==========================
  closePanel();

})();