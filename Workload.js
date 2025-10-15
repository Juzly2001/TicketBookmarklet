javascript:(function () {
  const ID = "mini-excel";
  const old = document.getElementById(ID);
  if (old) {
    old.remove();
    return;
  }

  // ===== Khởi tạo container chính =====
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

  // ===== Thanh tiêu đề =====
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

  // ===== Hàm tạo nút =====
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

  const toggleBtn = makeBtn("Hide", "#f59e0b", "#d97706");
  const clearBtn = makeBtn("Reset", "#ef4444", "#b91c1c");

  btnGroup.appendChild(toggleBtn);
  btnGroup.appendChild(clearBtn);
  headerBar.appendChild(title);
  headerBar.appendChild(btnGroup);
  container.appendChild(headerBar);

  // ===== Ô nhập Delay =====
  const delayWrap = document.createElement("div");
  delayWrap.style =
    "padding:6px;background:#f3f4f6;border-bottom:1px solid #ddd";
  delayWrap.innerHTML =
    'Delay (s): <input id="miniDelay" type="number" value="2" style="width:50px">';
  container.appendChild(delayWrap);

  // ===== Bảng dữ liệu =====
  const tableWrapper = document.createElement("div");
  Object.assign(tableWrapper.style, {
    flex: "1",
    overflow: "auto",
  });
  container.appendChild(tableWrapper);

  const table = document.createElement("table");
  Object.assign(table.style, {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  });
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

  // ===== Cập nhật STT =====
  function updateSTT() {
    let i = 1;
    table.querySelectorAll("tr.row").forEach((row) => {
      row.querySelector("td.stt").innerText = i++;
    });
  }

  // ===== Thêm 1 dòng mới =====
  function addRow(value = "") {
    const row = document.createElement("tr");
    row.className = "row";

    const sttCell = document.createElement("td");
    sttCell.className = "stt";
    Object.assign(sttCell.style, {
      padding: "6px",
      borderBottom: "1px solid #e5e7eb",
      textAlign: "center",
    });

    const col1 = document.createElement("td");
    col1.contentEditable = "true";
    col1.innerText = value;
    Object.assign(col1.style, {
      padding: "6px",
      borderBottom: "1px solid #e5e7eb",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "150px",
    });

    // Dán nhiều dòng sẽ tự thêm hàng
    col1.addEventListener("paste", function (e) {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length > 1) {
        col1.innerText = lines[0];
        for (let i = 1; i < lines.length; i++) addRow(lines[i]);
        updateSTT();
      } else {
        document.execCommand("insertText", false, text);
      }
    });

    // Enter để thêm hàng mới
    col1.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        addRow();
        updateSTT();
        setTimeout(() => {
          table.querySelector("tr.row:last-child td:nth-child(2)").focus();
        }, 0);
      }
    });

    // ===== Nút Send =====
    const col2 = document.createElement("td");
    Object.assign(col2.style, {
      padding: "6px",
      borderBottom: "1px solid #e5e7eb",
      textAlign: "center",
    });

    const sendBtn = makeBtn("Send", "#10b981", "#059669");
    sendBtn.onclick = function () {
      [...table.querySelectorAll("tr.row")].forEach(
        (r) => (r.style.background = "")
      );
      row.style.background = "#fffa8b";

      const input = document.querySelector(
        'input[placeholder="Nhập câu trả lời của bạn"]'
      );
      if (input) {
        input.value = col1.innerText.trim();
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();

        const submitBtn = document.querySelector(
          'button[data-automation-id="submitButton"]'
        );

        if (submitBtn) {
          submitBtn.click();

          (function waitAndClick() {
            const againBtn = document.querySelector(
              'span[data-automation-id="submitAnother"]'
            );
            if (againBtn) {
              const delaySec =
                parseInt(document.getElementById("miniDelay").value) || 0;
              setTimeout(() => againBtn.click(), delaySec * 1000);
            } else {
              setTimeout(waitAndClick, 500);
            }
          })();
        } else alert("Không tìm thấy nút Gửi trong form!");
      } else alert("Không tìm thấy ô input trong form!");
    };
    col2.appendChild(sendBtn);

    // ===== Nút Delete =====
    const col3 = document.createElement("td");
    Object.assign(col3.style, {
      padding: "6px",
      borderBottom: "1px solid #e5e7eb",
      textAlign: "center",
    });

    const delBtn = makeBtn("Delete", "#ef4444", "#dc2626");
    delBtn.onclick = function () {
      row.remove();
      updateSTT();
    };
    col3.appendChild(delBtn);

    row.appendChild(sttCell);
    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);
    table.appendChild(row);

    updateSTT();
  }

  // ===== Nút Reset =====
  clearBtn.onclick = function () {
    [...table.querySelectorAll("tr.row")].forEach((r) => r.remove());
    addRow();
    updateSTT();
  };

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
        container.style.width = "280px";
        container.style.height = "auto";
        toggleBtn.innerText = "Show";
      }
    }
  });

  // ===== Nút Hide/Show =====
  toggleBtn.onclick = function () {
    if (tableWrapper.style.display === "none") {
      tableWrapper.style.display = "block";
      container.style.width = "33%";
      container.style.height = "100%";
      toggleBtn.innerText = "Hide";
    } else {
      tableWrapper.style.display = "none";
      container.style.width = "280px";
      container.style.height = "auto";
      toggleBtn.innerText = "Show";
    }
  };

  // ===== Khởi tạo hàng đầu tiên =====
  addRow();
})();
