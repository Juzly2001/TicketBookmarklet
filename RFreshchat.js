javascript:(()=>{ 
const ID="mini-excel-chat-tool-left-tooltip"; 
if(document.getElementById(ID))document.getElementById(ID).remove(); 

const rows=[ 
    {id:"HT - St1",text:"Cảm ơn anh/chị đã liên hệ đến Fanpage chính thức của Zalopay. Em là Phương, xin phép hỗ trợ anh/chị ạ."}, 
    {id:"HT - St2",text:"Em có thể hỗ trợ thông tin gì cho mình ạ?"}, 
    {id:"HT - dva",text:"Dạ vâng ạ"}, 
    {id:"HT - Hỗ trợ thêm",text:"Dạ Anh/chị còn cần em hỗ trợ thêm thông tin gì khác nữa không ạ?"} 
]; 

// =========================
// HÀM THÊM DÒNG
// =========================
function addRow(id, text){ rows.push({id, text}); } 

function createFragmentFromText(text){ 
    let t=String(text).replace(/<br\s*\/?>/gi,"\n").replace(/\r\n?/g,"\n"); 
    const lines=t.split("\n"); 
    const frag=document.createDocumentFragment(); 
    lines.forEach((line,idx)=>{ 
        const span=document.createElement("span"); 
        span.textContent=line;
        frag.appendChild(span); 
        if(idx<lines.length-1)frag.appendChild(document.createElement("br")); 
    }); 
    return frag; 
} 

const container=document.createElement("div"); 
container.id=ID; 
container.style.position="fixed"; 
container.style.top="10px"; 
container.style.right="10px"; 
container.style.zIndex=999999; 
container.style.background="#fff"; 
container.style.border="1px solid #ddd"; 
container.style.boxShadow="0 6px 18px rgba(0,0,0,0.12)"; 
container.style.borderRadius="8px"; 
container.style.fontFamily="Segoe UI, Roboto, Arial, sans-serif"; 
container.style.fontSize="13px"; 
container.style.width="420px"; 
container.style.overflow="hidden"; 

const toggleBtn=document.createElement("button"); 
toggleBtn.innerText="Ẩn/Hiện (Ctrl + Space)"; 
toggleBtn.style.width="100%"; 
toggleBtn.style.padding="8px"; 
toggleBtn.style.cursor="pointer"; 
toggleBtn.style.border="none"; 
toggleBtn.style.background="#0b74de"; 
toggleBtn.style.color="#fff"; 
toggleBtn.style.fontWeight="600"; 
toggleBtn.style.borderTopLeftRadius="8px"; 
toggleBtn.style.borderTopRightRadius="8px"; 
container.appendChild(toggleBtn); 

const tableWrapper=document.createElement("div"); 
tableWrapper.style.padding="8px"; 
tableWrapper.style.maxHeight="80vh"; 
tableWrapper.style.overflow="auto"; 

const table=document.createElement("table"); 
table.style.borderCollapse="collapse"; 
table.style.width="100%"; 
table.style.tableLayout="fixed"; 

// =========================
// Thanh công cụ Import Excel + Search (đẹp + có bàn phím ẩn hiện)
// =========================
const headerTools = document.createElement("tr");
const thTools = document.createElement("th");
thTools.colSpan = 3;
thTools.style.padding = "6px 10px";
thTools.style.textAlign = "left";
thTools.style.background = "#f8f9fa";
thTools.style.borderBottom = "1px solid #ddd";

// Ô import
const importLabel = document.createElement("label");
importLabel.textContent = "📂 Import Excel";
importLabel.style.background = "#0d6efd";
importLabel.style.color = "#fff";
importLabel.style.padding = "6px 10px";
importLabel.style.borderRadius = "6px";
importLabel.style.cursor = "pointer";
importLabel.style.marginRight = "8px";
importLabel.style.display = "inline-block";
const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".xls,.xlsx";
importInput.style.display = "none";
importInput.addEventListener("change", parseExcel);
importLabel.appendChild(importInput);

// Ô tìm kiếm
const searchContainer = document.createElement("div");
searchContainer.style.display = "inline-flex";
searchContainer.style.alignItems = "center";
searchContainer.style.border = "1px solid #ccc";
searchContainer.style.borderRadius = "6px";
searchContainer.style.padding = "2px 6px";
searchContainer.style.background = "#fff";

const searchInput = document.createElement("input");
searchInput.placeholder = "Tìm theo ID...";
searchInput.style.border = "none";
searchInput.style.outline = "none";
searchInput.style.padding = "4px";
searchInput.style.width = "100%";
searchInput.addEventListener("input", (e) => {
  renderRows(e.target.value);
});

// Nút xóa input (SVG)
const clearBtn = document.createElement("button");
clearBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
    <path fill="none" stroke="#344054" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6l-12 12"/>
  </svg>`;
clearBtn.style.display = "flex";
clearBtn.style.alignItems = "center";
clearBtn.style.justifyContent = "center";
clearBtn.style.width = "24px";
clearBtn.style.height = "24px";
clearBtn.style.border = "none";
clearBtn.style.background = "transparent";
clearBtn.style.cursor = "pointer";
clearBtn.style.marginLeft = "4px";
clearBtn.title = "Xóa nhanh";
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.dispatchEvent(new Event("input"));
});

// Nút toggle bàn phím (SVG)
const keyboardToggle = document.createElement("button");
keyboardToggle.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" fill="none" stroke="#344054" stroke-width="2"/>
    <path stroke="#344054" stroke-width="2" stroke-linecap="round" d="M7 9h.01M11 9h.01M15 9h.01M7 13h10M7 17h10"/>
  </svg>`;
keyboardToggle.style.display = "flex";
keyboardToggle.style.alignItems = "center";
keyboardToggle.style.justifyContent = "center";
keyboardToggle.style.width = "24px";
keyboardToggle.style.height = "24px";
keyboardToggle.style.border = "none";
keyboardToggle.style.background = "transparent";
keyboardToggle.style.cursor = "pointer";
keyboardToggle.style.marginLeft = "2px";
keyboardToggle.title = "Bật/Tắt bàn phím";

searchContainer.appendChild(searchInput);
searchContainer.appendChild(clearBtn);
searchContainer.appendChild(keyboardToggle);

// =========================
// HÀM GÕ TIẾNG VIỆT TELEX (giống Unikey cơ bản)
// =========================
function applyVietnameseTelex(str) {
  // Bước 1: xử lý nguyên âm ghép (ưu tiên trước)
  str = str
    .replace(/dd/g, "đ")
    .replace(/aa/g, "â")
    .replace(/aw/g, "ă")
    .replace(/ee/g, "ê")
    .replace(/oo/g, "ô")
    .replace(/ow/g, "ơ")
    .replace(/uw/g, "ư");

  // Bước 2: thêm dấu thanh (s, f, r, x, j)
  str = str
    .replace(/(a|ă|â|e|ê|i|o|ô|ơ|u|ư|y)s/g, (_, m) => ({
      a: "á", ă: "ắ", â: "ấ", e: "é", ê: "ế", i: "í", o: "ó", ô: "ố", ơ: "ớ", u: "ú", ư: "ứ", y: "ý"
    }[m] || m))
    .replace(/(a|ă|â|e|ê|i|o|ô|ơ|u|ư|y)f/g, (_, m) => ({
      a: "à", ă: "ằ", â: "ầ", e: "è", ê: "ề", i: "ì", o: "ò", ô: "ồ", ơ: "ờ", u: "ù", ư: "ừ", y: "ỳ"
    }[m] || m))
    .replace(/(a|ă|â|e|ê|i|o|ô|ơ|u|ư|y)r/g, (_, m) => ({
      a: "ả", ă: "ẳ", â: "ẩ", e: "ẻ", ê: "ể", i: "ỉ", o: "ỏ", ô: "ổ", ơ: "ở", u: "ủ", ư: "ử", y: "ỷ"
    }[m] || m))
    .replace(/(a|ă|â|e|ê|i|o|ô|ơ|u|ư|y)x/g, (_, m) => ({
      a: "ã", ă: "ẵ", â: "ẫ", e: "ẽ", ê: "ễ", i: "ĩ", o: "õ", ô: "ỗ", ơ: "ỡ", u: "ũ", ư: "ữ", y: "ỹ"
    }[m] || m))
    .replace(/(a|ă|â|e|ê|i|o|ô|ơ|u|ư|y)j/g, (_, m) => ({
      a: "ạ", ă: "ặ", â: "ậ", e: "ẹ", ê: "ệ", i: "ị", o: "ọ", ô: "ộ", ơ: "ợ", u: "ụ", ư: "ự", y: "ỵ"
    }[m] || m));

  return str;
}


// Bàn phím ảo
const keyboard = document.createElement("div");
keyboard.style.display = "none";
keyboard.style.marginTop = "8px";
keyboard.style.padding = "8px";
keyboard.style.background = "#fff";
keyboard.style.border = "1px solid #ddd";
keyboard.style.borderRadius = "10px";
keyboard.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
keyboard.style.textAlign = "center";
keyboard.style.transition = "all 0.3s ease";
keyboard.style.fontFamily = "monospace";

const rowsKeys = [
  "Q W E R T Y U I O P",
  "A S D F G H J K L",
  "Z X C V B N M"
];

rowsKeys.forEach((row) => {
  const rowDiv = document.createElement("div");
  rowDiv.style.margin = "4px 0";
  row.split(" ").forEach((key) => {
    const btn = document.createElement("button");
    btn.textContent = key;
    btn.style.margin = "2px";
    btn.style.padding = "6px 10px";
    btn.style.border = "1px solid #ccc";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.background = "#f9f9f9";
    btn.style.fontWeight = "500";
    btn.addEventListener("click", () => {
    let current = searchInput.value;
    let newText = current + key.toLowerCase(); // nhập thường để ghép Telex
    searchInput.value = applyVietnameseTelex(newText);
    searchInput.dispatchEvent(new Event("input"));
    });
    btn.addEventListener("mousedown", () => (btn.style.background = "#e1e1e1"));
    btn.addEventListener("mouseup", () => (btn.style.background = "#f9f9f9"));
    rowDiv.appendChild(btn);
  });
  keyboard.appendChild(rowDiv);
});

keyboardToggle.addEventListener("click", () => {
  keyboard.style.display = keyboard.style.display === "none" ? "block" : "none";
});

thTools.appendChild(importLabel);
thTools.appendChild(searchContainer);
thTools.appendChild(keyboard);

// ======= Hàng cuối: Xóa, Space =======
const extraRow = document.createElement("div");
extraRow.style.display = "flex";
extraRow.style.gap = "6px";
extraRow.style.justifyContent = "center";
extraRow.style.marginTop = "6px";

// Nút Xóa
const backspaceBtn = document.createElement("button");
backspaceBtn.textContent = "←";
backspaceBtn.style.padding = "8px 12px";
backspaceBtn.style.borderRadius = "8px";
backspaceBtn.style.border = "1px solid #ccc";
backspaceBtn.style.cursor = "pointer";
backspaceBtn.style.fontWeight = "600";
backspaceBtn.style.background = "white";
backspaceBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
backspaceBtn.addEventListener("click", () => {
  searchInput.value = searchInput.value.slice(0, -1);
  searchInput.dispatchEvent(new Event("input")); // 🔥 Cập nhật kết quả ngay
});

// Nút Space
const spaceBtn = document.createElement("button");
spaceBtn.textContent = "Space";
spaceBtn.style.padding = "8px 32px";
spaceBtn.style.borderRadius = "8px";
spaceBtn.style.border = "1px solid #ccc";
spaceBtn.style.cursor = "pointer";
spaceBtn.style.fontWeight = "600";
spaceBtn.style.background = "white";
spaceBtn.style.boxShadow = "0 1px 2px rgba(0,0,0,0.1)";
spaceBtn.addEventListener("click", () => {
  searchInput.value += " ";
  searchInput.dispatchEvent(new Event("input"));
});

extraRow.appendChild(spaceBtn);
extraRow.appendChild(backspaceBtn);
keyboard.appendChild(extraRow);


headerTools.appendChild(thTools);
table.appendChild(headerTools);


// =========================
// Tooltip
// =========================
const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.background = "#333";
tooltip.style.color = "#fff";
tooltip.style.padding = "6px 10px";
tooltip.style.borderRadius = "6px";
tooltip.style.fontSize = "13px";
tooltip.style.maxWidth = "300px";
tooltip.style.whiteSpace = "pre-wrap";
tooltip.style.zIndex = 9999999;
tooltip.style.opacity = 0;
tooltip.style.transition = "opacity 0.2s, transform 0.2s";

// ✅ Cho phép copy, chọn text, cuộn, tương tác chuột
tooltip.style.pointerEvents = "auto";
tooltip.style.userSelect = "text";
tooltip.style.cursor = "text";
tooltip.style.maxHeight = "200px";
tooltip.style.overflowY = "auto";

document.body.appendChild(tooltip);


// =========================
// Hàm render bảng
// =========================
let hideTooltipTimeout;
function renderRows(){ 
    Array.from(table.querySelectorAll("tr[data-row='true']")).forEach(tr=>tr.remove()); 
    rows.forEach(r=>{ 
        const tr=document.createElement("tr"); 
        tr.setAttribute("data-row","true"); 
        tr.setAttribute("data-id",r.id.toLowerCase()); 

        const td1=document.createElement("td"); 
        td1.innerText=r.id; 
        td1.style.padding="6px"; 
        td1.style.textAlign="left"; 
        td1.style.borderBottom="1px solid #f1f1f1"; 
        tr.appendChild(td1); 

        const td2=document.createElement("td"); 
        td2.textContent = String(r.text).split("\n")[0];
        td2.style.padding="6px 8px"; 
        td2.style.whiteSpace="nowrap"; 
        td2.style.overflow="hidden"; 
        td2.style.textOverflow="ellipsis";
        td2.style.maxHeight = "20px";          // đảm bảo không vượt ô 
        td2.style.borderBottom="1px solid #f1f1f1"; 
        td2.onmouseenter = (e) => {
            clearTimeout(hideTooltipTimeout);
            tooltip.innerHTML = "";
            tooltip.appendChild(createFragmentFromText(r.text));

            const rect = td2.getBoundingClientRect();
            tooltip.style.left = (rect.left - window.scrollX - tooltip.offsetWidth - 8) + "px";
            let topPos = rect.top + window.scrollY;
            if (topPos + tooltip.offsetHeight > window.scrollY + window.innerHeight)
                topPos = window.scrollY + window.innerHeight - tooltip.offsetHeight - 8;
            if (topPos < window.scrollY) topPos = window.scrollY + 8;
            tooltip.style.top = topPos + "px";

            tooltip.style.opacity = 1;
            tooltip.style.transform = "translateX(0)";
            tooltip.style.pointerEvents = "auto"; // ✅ Cho phép hover tooltip
            };

            td2.onmouseleave = (e) => {
            hideTooltipTimeout = setTimeout(() => {
                tooltip.style.opacity = 0;
                tooltip.style.transform = "translateX(-8px)";
                tooltip.style.pointerEvents = "none"; // ✅ Ngăn nhận chuột, khử hiệu ứng text-select
            }, 200);
            };

            tooltip.onmouseenter = () => {
            clearTimeout(hideTooltipTimeout);
            };

            tooltip.onmouseleave = () => {
            tooltip.style.opacity = 0;
            tooltip.style.transform = "translateX(-8px)";   
            tooltip.style.pointerEvents = "none"; // ✅ Khử chọn chữ khi ẩn
            };

        tr.appendChild(td2); 

        const td3=document.createElement("td"); 
        td3.style.padding="6px"; 
        td3.style.textAlign="center"; 
        td3.style.borderBottom="1px solid #f1f1f1"; 
        const btn=document.createElement("button"); 
        btn.innerText="Send"; 
        btn.style.padding="6px 10px"; 
        btn.style.cursor="pointer"; 
        btn.style.border="1px solid #2e8b57"; 
        btn.style.borderRadius="6px"; 
        btn.style.background="#2e8b57"; 
        btn.style.color="#fff"; 
       btn.onclick=()=>{ 
    const input=document.querySelector(".msg-reply-box[contenteditable='true']") 
              || document.querySelector(".msg-reply-box"); 
    if(!input){ 
        alert("Không tìm thấy ô nhập tin nhắn (.msg-reply-box)."); 
        return; 
    } 

    // Giữ nguyên \n trong text, đừng convert thành <br>
    const text = r.text.replace(/\r\n?/g, "\n");

    input.focus();
    input.innerHTML = "";              // xoá trước
    input.textContent = text;          // gán thẳng dạng text (giữ cả dòng trắng)

    input.dispatchEvent(new InputEvent("input",{bubbles:true,cancelable:true})); 

    setTimeout(()=>{ 
        const sendBtn=document.querySelector("div[data-test-fc-send-button='root']"); 
        if(sendBtn) sendBtn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); 
    },50); 
};

        td3.appendChild(btn); 
        tr.appendChild(td3); 

        table.appendChild(tr); 
    }); 
} 
renderRows(); 

// =========================
// Search
// =========================
searchInput.addEventListener("input",()=>{ 
    const keyword=searchInput.value.toLowerCase(); 
    Array.from(table.querySelectorAll("tr[data-row='true']")).forEach(tr=>{ 
        const idText=tr.getAttribute("data-id"); 
        tr.style.display=!keyword||idText.includes(keyword)?"":"none"; 
    }); 
}); 

// =========================
// Import Excel
// =========================
importInput.addEventListener("change",async e=>{ 
    const file=e.target.files[0]; 
    if(!file) return; 
    const data=await file.arrayBuffer(); 
    if(!window.XLSX){ 
        const script=document.createElement("script"); 
        script.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
        script.onload=()=>parseExcel(data); 
        document.body.appendChild(script); 
    }else parseExcel(data); 
}); 

function parseExcel(data){ 
    const wb=XLSX.read(data,{type:"array"}); 
    const sheet=wb.Sheets[wb.SheetNames[0]]; 
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }); 
    json.forEach((row) => { 
        if (!row || row.length < 2) return; 
        const id = row[0]?.toString().trim(); 
        const text = row[1]?.toString().trim(); 
        if (!id || !text) return; 
        if (id.toLowerCase()==="id" || text.toLowerCase()==="text") return; 
        addRow(id, text); 
    }); 
    renderRows(); 
} 

tableWrapper.appendChild(table); 
container.appendChild(tableWrapper); 
document.body.appendChild(container); 

// Cho phép kéo thả container
let isDragging = false;
let offsetX, offsetY;

toggleBtn.style.cursor = "move"; // đổi thành tay kéo khi rê vào header

toggleBtn.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = container.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.body.style.userSelect = "none"; // tránh bôi đen chữ khi kéo
});

document.addEventListener("mousemove", (e) => {
    if (isDragging) {
        container.style.left = (e.clientX - offsetX) + "px";
        container.style.top = (e.clientY - offsetY) + "px";
        container.style.right = "auto"; // bỏ cố định right
        container.style.bottom = "auto"; // bỏ cố định bottom
        container.style.position = "fixed";
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
});
// Thêm nút kéo resize ở góc phải dưới
const resizeHandle = document.createElement("div");
resizeHandle.style.width = "12px";
resizeHandle.style.height = "12px";
resizeHandle.style.background = "rgba(0,0,0,0.3)";
resizeHandle.style.position = "absolute";
resizeHandle.style.right = "2px";
resizeHandle.style.bottom = "2px";
resizeHandle.style.cursor = "nwse-resize";
resizeHandle.style.borderRadius = "2px";
container.appendChild(resizeHandle);

let isResizing = false, startX, startY, startWidth, startHeight;

resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = container.offsetWidth;
    startHeight = container.offsetHeight;
    document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
    if (isResizing) {
        const newWidth = startWidth + (e.clientX - startX);
        const newHeight = startHeight + (e.clientY - startY);
        container.style.width = newWidth + "px";
        container.style.height = newHeight + "px";
    }
});

document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "auto";
});

let isVisible = true;


document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.code === "Space") {
        isVisible = !isVisible;
        container.style.display = isVisible ? "block" : "none";
        e.preventDefault();
    }
});

})();