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
// Thanh công cụ Import Excel + Search
// =========================
const headerTools = document.createElement("tr");
const thTools = document.createElement("th");
thTools.colSpan = 3;
thTools.style.borderBottom = "1px solid #eee";
thTools.style.background = "#fafafa";
thTools.style.padding = "4px";

// Wrapper flex
const flexWrapper = document.createElement("div");
flexWrapper.style.display = "flex";
flexWrapper.style.width = "100%";
flexWrapper.style.gap = "6px"; 

// Nút Import Excel
const importLabel = document.createElement("label");
importLabel.innerText = "📥 Import Excel";
importLabel.style.display = "flex";
importLabel.style.alignItems = "center";
importLabel.style.justifyContent = "center";
importLabel.style.flex = "0 0 30%";
importLabel.style.padding = "6px 10px";
importLabel.style.cursor = "pointer";
importLabel.style.background = "#007bff";
importLabel.style.color = "#fff";
importLabel.style.borderRadius = "6px";
importLabel.style.fontWeight = "500";

const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".xlsx,.xls";
importInput.style.display = "none";
importLabel.appendChild(importInput);

// Ô Search
const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.placeholder = "Tìm theo ID...";
searchInput.style.flex = "1";
searchInput.style.padding = "6px";
searchInput.style.fontSize = "13px";
searchInput.style.border = "1px solid #ccc";
searchInput.style.borderRadius = "6px";

// Đồng bộ chiều cao
searchInput.style.height = importLabel.style.height = "36px";

flexWrapper.appendChild(importLabel);
flexWrapper.appendChild(searchInput);
thTools.appendChild(flexWrapper);
headerTools.appendChild(thTools);
table.appendChild(headerTools);

// =========================
// Tooltip
// =========================
const tooltip=document.createElement("div");
tooltip.style.position="absolute";
tooltip.style.background="#333";
tooltip.style.color="#fff";
tooltip.style.padding="6px 10px";
tooltip.style.borderRadius="6px";
tooltip.style.fontSize="13px";
tooltip.style.maxWidth="300px";
tooltip.style.whiteSpace="pre-wrap";
tooltip.style.zIndex=9999999;
tooltip.style.opacity=0;
tooltip.style.transition="opacity 0.2s, transform 0.2s";
tooltip.style.pointerEvents="none";
document.body.appendChild(tooltip);

// =========================
// Hàm render bảng
// =========================
function renderRows(){ 
    Array.from(table.querySelectorAll("tr[data-row='true']")).forEach(tr=>tr.remove()); 
    rows.forEach(r=>{ 
        const tr=document.createElement("tr"); 
        tr.setAttribute("data-row","true"); 
        tr.setAttribute("data-id",r.id.toLowerCase()); 

        const td1=document.createElement("td"); 
        td1.innerText=r.id; 
        td1.style.padding="6px"; 
        td1.style.textAlign="center"; 
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
        td2.onmouseenter=e=>{ 
            tooltip.innerHTML=""; 
            tooltip.appendChild(createFragmentFromText(r.text)); 
            const rect=td2.getBoundingClientRect(); 
            tooltip.style.left=(rect.left-window.scrollX-tooltip.offsetWidth-8)+"px"; 
            let topPos=rect.top+window.scrollY; 
            if(topPos+tooltip.offsetHeight>window.scrollY+window.innerHeight) 
                topPos=window.scrollY+window.innerHeight-tooltip.offsetHeight-8; 
            if(topPos<window.scrollY) topPos=window.scrollY+8; 
            tooltip.style.top=topPos+"px"; 
            tooltip.style.opacity=1; 
            tooltip.style.transform="translateX(0)"; 
        }; 
        td2.onmouseleave=e=>{ tooltip.style.opacity=0; tooltip.style.transform="translateX(-8px)"; }; 
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