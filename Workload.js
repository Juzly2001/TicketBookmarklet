javascript:(function () {
  const ID = "mini-excel";
  if (document.getElementById(ID)) {
    document.getElementById(ID).remove();
    return;
  }

  const container = document.createElement("div");
  container.id = ID;
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    right: "0",
    width: "33%",
    height: "100%",
    background: "#fff",
    borderLeft: "1px solid #e5e7eb",
    zIndex: 99999,
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "-2px 0 8px rgba(0,0,0,0.15)",
    transition: "all 0.3s ease",
  });

  // Header
  const headerBar = document.createElement("div");
  Object.assign(headerBar.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
    borderBottom: "1px solid #1e40af",
  });

  const title = document.createElement("div");
  title.innerText = "📊 Mini Excel";
  Object.assign(title.style, { fontSize: "16px" });

  const btnGroup = document.createElement("div");
  function makeBtn(txt, bg = "#3b82f6", hover = "#1d4ed8") {
    const b = document.createElement("button");
    b.innerText = txt;
    Object.assign(b.style, {
      background: bg,
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      marginLeft: "6px",
      fontSize: "13px",
      transition: "0.2s",
    });
    b.onmouseenter = () => (b.style.background = hover);
    b.onmouseleave = () => (b.style.background = bg);
    return b;
  }

  const autoBtn = makeBtn("Auto", "#10b981", "#059669");
  const stopBtn = makeBtn("Stop", "#f87171", "#dc2626");
  stopBtn.style.display = "none"; // ẩn nút Dừng lúc đầu
  const toggleBtn = makeBtn("Hide", "#f59e0b", "#d97706");
  const clearBtn = makeBtn("Reset", "#ef4444", "#b91c1c");

  btnGroup.appendChild(autoBtn);
  btnGroup.appendChild(stopBtn);
  btnGroup.appendChild(toggleBtn);
  btnGroup.appendChild(clearBtn);
  headerBar.appendChild(title);
  headerBar.appendChild(btnGroup);
  container.appendChild(headerBar);

  // Input Delay
  const delayWrap = document.createElement("div");
  delayWrap.style = "padding:6px;background:#f3f4f6;border-bottom:1px solid #ddd";
  delayWrap.innerHTML =
    'Delay (s): <input id="miniDelay" type="number" value="1" style="width:50px">';
  container.appendChild(delayWrap);

  // Status bar
  const statusBar = document.createElement("div");
  Object.assign(statusBar.style, {
    padding: "6px",
    background: "#f9fafb",
    borderBottom: "1px solid #ddd",
    color: "#374151",
    fontStyle: "italic",
  });
  statusBar.innerText = "⏸ Đang chờ bắt đầu...";
  container.appendChild(statusBar);

  // Table
  const tableWrapper = document.createElement("div");
  Object.assign(tableWrapper.style, { flex: "1", overflow: "auto" });
  container.appendChild(tableWrapper);

  const table = document.createElement("table");
  Object.assign(table.style, { width: "100%", borderCollapse: "collapse", fontSize: "14px" });
  table.id = "excel-table";

  const header = document.createElement("tr");
  header.innerHTML = `
    <th style='border-bottom:2px solid #2563eb; padding:8px; width:10%; text-align:left;'>STT</th>
    <th style='border-bottom:2px solid #2563eb; padding:8px; width:40%; text-align:left;'>Dữ liệu</th>
    <th style='border-bottom:2px solid #2563eb; padding:8px; width:25%; text-align:center;'>Hành động</th>
    <th style='border-bottom:2px solid #2563eb; padding:8px; width:25%; text-align:center;'>Xóa</th>
  `;
  table.appendChild(header);
  tableWrapper.appendChild(table);
  document.body.appendChild(container);

  function updateSTT() {
    let i = 1;
    table.querySelectorAll("tr.row").forEach((row) => {
      row.querySelector("td.stt").innerText = i++;
    });
  }

  let autoRunning = false;
  let currentIndex = 0;

  // Queue
  const taskQueue = [];
  let processingQueue = false;
  function enqueueTask(fn, front = false) {
    return new Promise((resolve, reject) => {
      const item = { fn, resolve, reject };
      if (front) taskQueue.unshift(item);
      else taskQueue.push(item);
      if (!processingQueue) processQueue();
    });
  }
  async function processQueue() {
    processingQueue = true;
    while (taskQueue.length) {
      const item = taskQueue.shift();
      try { await item.fn(); item.resolve(); } 
      catch(e){ item.reject(e); }
    }
    processingQueue = false;
  }

  function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - start > timeout) return reject("⏰ Timeout: " + selector);
        setTimeout(check, 300);
      })();
    });
  }

  async function sendRow(row) {
    const inputSelector =
      'textarea[placeholder="Nhập câu trả lời của bạn"], input[placeholder="Nhập câu trả lời của bạn"]';
    const submitSelector = 'button[data-automation-id="submitButton"]';
    const againSelector = 'span[data-automation-id="submitAnother"]';
    const delaySec = parseInt(document.getElementById("miniDelay").value) || 0;
    const text = row.querySelector("td:nth-child(2)").innerText.trim();

    const input = await waitForElement(inputSelector);
    const sendBtn = await waitForElement(submitSelector);

    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    sendBtn.click();
    console.log("✅ Đã gửi:", text);

    await new Promise((r) => setTimeout(r, delaySec * 1000));
    const againBtn = await waitForElement(againSelector);
    againBtn.click();
    await waitForElement(inputSelector);
  }

  async function autoSendAll() {
    const rows = [...table.querySelectorAll("tr.row")];
    if (rows.length === 0 || rows[0].querySelector("td:nth-child(2)").innerText.trim() === "") {
        alert("⚠️ Dòng đầu tiên trống, không thể bật Auto!");
        return;
    }

    autoRunning = true;
    autoBtn.style.display = "none"; // ẩn nút Auto khi đang chạy
    stopBtn.style.display = "inline-block"; // hiện nút Dừng
    statusBar.innerText = `▶️ Đang auto từ dòng ${currentIndex + 1}...`;

    for (let i = currentIndex; i < rows.length; i++) {
        if (!autoRunning) { 
            currentIndex = i; 
            statusBar.innerText = `⏸ Tiếp tục từ dòng ${i+1}`; 
            autoBtn.style.display="inline-block"; 
            stopBtn.style.display="none"; 
            return; 
        }
        currentIndex = i;
        const allRows = [...table.querySelectorAll("tr.row")];
        if (i >= allRows.length) break;

        allRows[i].style.background = "#fffa8b"; // highlight auto
        allRows[i].scrollIntoView({ behavior: "smooth", block: "center" }); // scroll đến dòng
        statusBar.innerText = `▶️ Auto gửi dòng ${i+1}/${allRows.length}`;
        try { await enqueueTask(() => sendRow(allRows[i])); }
        catch(e){ console.error("⚠️ Lỗi dòng", i+1,e); statusBar.innerText = `⚠️ Lỗi dòng ${i+1}: ${e}`; break; }
    }
    statusBar.innerText = "🎉 Auto send hoàn tất!";
    autoRunning = false;
    currentIndex = 0;
    autoBtn.style.display="inline-block"; stopBtn.style.display="none"; // reset hiển thị nút
    setTimeout(() => { table.querySelectorAll("tr.row").forEach(r => r.style.background = ""); }, 600);
}


  autoBtn.onclick = autoSendAll;
  stopBtn.onclick = () => {
    if (!autoRunning) { statusBar.innerText="⏸ Không có tiến trình"; return; }
    autoRunning = false; 
    statusBar.innerText=`⏸ Đã dừng tại dòng ${currentIndex+1}`;
    autoBtn.style.display="inline-block"; 
    stopBtn.style.display="none";
  };

  function addRow(value="") {
    const row = document.createElement("tr"); row.className="row";
    const sttCell = document.createElement("td"); sttCell.className="stt";
    Object.assign(sttCell.style,{padding:"6px",borderBottom:"1px solid #e5e7eb",textAlign:"center"});
    const col1 = document.createElement("td"); col1.contentEditable="true"; col1.innerText=value;
    Object.assign(col1.style,{padding:"6px",borderBottom:"1px solid #e5e7eb",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"150px"});

    col1.addEventListener("paste",function(e){
      e.preventDefault();
      const text=(e.clipboardData||window.clipboardData).getData("text");
      const lines=text.split(/\r?\n/).filter(l=>l.trim()!=="");
      if(lines.length>1){ col1.innerText=lines[0]; for(let i=1;i<lines.length;i++) addRow(lines[i]); updateSTT(); }
      else document.execCommand("insertText", false, text);
    });

    col1.addEventListener("keydown",function(e){ if(e.key==="Enter"){ e.preventDefault(); addRow(); updateSTT(); setTimeout(()=>{table.querySelector("tr.row:last-child td:nth-child(2)").focus();},0); }});

    const col2 = document.createElement("td"); Object.assign(col2.style,{padding:"6px",borderBottom:"1px solid #e5e7eb",textAlign:"center"});
    const sendBtn = makeBtn("Send","#10b981","#059669");
    sendBtn.onclick = async function(){
      if(autoRunning){ alert("⚠️ Đang chạy Auto! Dừng Auto trước khi gửi thủ công."); return; }
      row.style.background="#d1fae5"; 
      statusBar.innerText=`✋ Send thủ công dòng ${sttCell.innerText}`;
      try{
        await enqueueTask(()=>sendRow(row),true);
        const allRows=[...table.querySelectorAll("tr.row")];
        const idx = allRows.indexOf(row);
        if(idx>=currentIndex) currentIndex=idx+1;
        statusBar.innerText=`✅ Send thủ công dòng ${sttCell.innerText} xong`;
      }catch(e){ console.error(e); row.style.background="#fecaca"; statusBar.innerText=`⚠️ Lỗi send thủ công: ${e}`;}
    };
    col2.appendChild(sendBtn);

    const col3 = document.createElement("td"); Object.assign(col3.style,{padding:"6px",borderBottom:"1px solid #e5e7eb",textAlign:"center"});
    const delBtn = makeBtn("Delete","#ef4444","#dc2626");
    delBtn.onclick=function(){
      const rows=[...table.querySelectorAll("tr.row")]; const idx=rows.indexOf(row);
      if(idx>=0 && idx<currentIndex) currentIndex=Math.max(0,currentIndex-1);
      row.remove(); updateSTT();
    };
    col3.appendChild(delBtn);

    row.appendChild(sttCell); row.appendChild(col1); row.appendChild(col2); row.appendChild(col3);
    table.appendChild(row); updateSTT();
  }

  clearBtn.onclick = function(){ [...table.querySelectorAll("tr.row")].forEach(r=>r.remove()); addRow(); updateSTT(); currentIndex=0; statusBar.innerText="⏸ Đang chờ bắt đầu...";};
  toggleBtn.onclick = function(){ if(tableWrapper.style.display==="none"){tableWrapper.style.display="block";container.style.width="33%";container.style.height="100%";toggleBtn.innerText="Hide";}else{tableWrapper.style.display="none";container.style.width="350px";container.style.height="auto";toggleBtn.innerText="Show";}};

// ===== Ẩn/hiện bằng Ctrl + Space =====
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      if (tableWrapper.style.display === "none") {
        tableWrapper.style.display = "block";
        container.style.width = "33%";
        container.style.height = "100%";
        toggleBtn.innerText = "Hide";
      } else {
        tableWrapper.style.display = "none";
        container.style.width = "350px";
        container.style.height = "auto";
        toggleBtn.innerText = "Show";
      }
    }
  });

  addRow();
})();
