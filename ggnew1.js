javascript:(()=>{
function initReviewLinksWidget(){
  const ID="mini-excel-review-links";
  document.getElementById(ID)?.remove();

  const box=document.createElement("div");
  box.id=ID;
  Object.assign(box.style,{
    position:"fixed",top:"160px",right:"10px",zIndex:999998,
    background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",
    padding:"12px",width:"700px",maxHeight:"400px",overflowY:"auto",
    fontSize:"15px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)",
    fontFamily:"Segoe UI,Roboto,Arial,sans-serif"
  });

  const header=document.createElement("div");
  Object.assign(header.style,{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"});
  const title=document.createElement("div");
  title.textContent="📋 Review Links";
  Object.assign(title.style,{fontWeight:"bold",fontSize:"24px"});

  const btnArea=document.createElement("div");
  const toggleBtn=document.createElement("button");toggleBtn.textContent="Ẩn";styleBtn(toggleBtn);toggleBtn.addEventListener("click",toggleWidgets);
  const copyAllBtn=document.createElement("button");copyAllBtn.textContent="Copy All";styleBtn(copyAllBtn);
  const againBtn=document.createElement("button");againBtn.textContent="Again";styleBtn(againBtn);
  const scanBtn=document.createElement("button");scanBtn.textContent="Scan";styleBtn(scanBtn);
  btnArea.append(toggleBtn,copyAllBtn,againBtn,scanBtn);
  header.append(title,btnArea);

  const table=document.createElement("table");
  Object.assign(table.style,{width:"100%",borderCollapse:"collapse",border:"1px solid #e5e7eb"});
  const thead=document.createElement("thead"),headRow=document.createElement("tr");
  ["STT","Link","Delete"].forEach(t=>{
    const th=document.createElement("th");
    th.textContent=t;
    Object.assign(th.style,{border:"1px solid #e5e7eb",padding:"8px",background:"#f9fafb",textAlign:"left",fontWeight:"600"});
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody=document.createElement("tbody");
  table.append(thead,tbody);
  box.append(header,table);
  document.body.appendChild(box);

  let counter=0,addedLinks=new Set,lastClipboardLink=null;

  function addRow(link){
    if(addedLinks.has(link))return;
    addedLinks.add(link);
    counter++;
    const row=document.createElement("tr");
    const td1=document.createElement("td");td1.textContent=counter;Object.assign(td1.style,{border:"1px solid #e5e7eb",padding:"6px",width:"40px",textAlign:"center"});
    const td2=document.createElement("td");td2.textContent=link;Object.assign(td2.style,{border:"1px solid #e5e7eb",padding:"6px",wordBreak:"break-all"});
    const td3=document.createElement("td");Object.assign(td3.style,{border:"1px solid #e5e7eb",padding:"6px",textAlign:"center"});
    const delBtn=document.createElement("button");delBtn.textContent="❌";styleBtn(delBtn,"danger");
    delBtn.onclick=()=>{tbody.removeChild(row);addedLinks.delete(link)};
    td3.appendChild(delBtn);
    row.append(td1,td2,td3);
    tbody.appendChild(row);
  }

  // 🧩 Đọc clipboard với chờ link mới
  async function captureClipboardLink(waitForNew=false, oldLink=null){
    const maxWait=2000; // tối đa 2 giây
    const start=Date.now();
    let text=null;
    while(Date.now()-start<maxWait){
      try{
        text=await navigator.clipboard.readText();
        if(text && text.startsWith("http") && text!==oldLink) break;
      }catch{}
      await new Promise(r=>setTimeout(r,150));
    }
    if(text && text.startsWith("http") && !addedLinks.has(text)){
      lastClipboardLink=text;
      addRow(text);
      return text;
    }
    return null;
  }

  // 🧠 Nút “Scan” tự click từng link-share-button
  async function scanReviewsWithReply(){
    const reviews=document.querySelectorAll("review");
    let count=0;
    for(const rev of reviews){
      const replyBox=rev.querySelector('textarea[aria-label="Trả lời"]');
      const shareBtn=rev.querySelector('material-button[debug-id="link-share-button"] button');
      if(replyBox && shareBtn){
        const oldLink=lastClipboardLink;
        shareBtn.click();
        const newLink=await captureClipboardLink(true,oldLink);
        if(newLink) count++;
        await new Promise(r=>setTimeout(r,400)); // nghỉ nhẹ để tránh trùng clipboard
      }
    }
    alert(`✅ Quét được ${count} link mới!`);
  }

  // Gắn click copy clipboard vào tất cả nút share
  document.querySelectorAll('material-button[debug-id="link-share-button"] button').forEach(btn=>{
    const newBtn=btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn,btn);
    newBtn.addEventListener("click",()=>setTimeout(()=>captureClipboardLink(false,lastClipboardLink),200));
  });

  copyAllBtn.onclick=()=>{
    const links=[...tbody.querySelectorAll("tr td:nth-child(2)")].map(td=>td.textContent.trim());
    if(links.length){navigator.clipboard.writeText(links.join("\n"));alert("✅ Đã copy tất cả link!")}
    else alert("⚠️ Không có link nào để copy.");
  };

  againBtn.onclick=()=>{box.remove();initReviewLinksWidget();console.log("🔄 Reset widget!");};

  scanBtn.onclick=scanReviewsWithReply;

  console.log("✅ Review Links đã bật!");
  initSampleContentWidget(box);
  initFloatingToggleBtn();

  // --- Các hàm phụ giữ nguyên ---
  function styleBtn(btn,type="default"){Object.assign(btn.style,{border:"1px solid #d1d5db",background:"#f9fafb",borderRadius:"6px",padding:"6px 12px",cursor:"pointer",fontSize:"14px",marginLeft:"6px"});btn.onmouseenter=()=>btn.style.background=type==="danger"?"#fee2e2":"#f3f4f6";btn.onmouseleave=()=>btn.style.background="#f9fafb";}
  function toggleWidgets(){["mini-excel-review-links","mini-excel-sample-content"].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=el.style.display==="none"?"block":"none";});}
  function initFloatingToggleBtn(){const BTN_ID="mini-excel-floating-toggle";document.getElementById(BTN_ID)?.remove();const btn=document.createElement("button");btn.id=BTN_ID;btn.textContent="Hiện";Object.assign(btn.style,{position:"fixed",top:"70px",right:"50px",zIndex:100000,background:"red",color:"white",border:"none",borderRadius:"50%",width:"50px",height:"50px",cursor:"pointer",fontSize:"16px",boxShadow:"0 2px 6px rgba(0,0,0,0.2)"});btn.onclick=toggleWidgets;document.body.appendChild(btn);}
  document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.code==="Space"){e.preventDefault();toggleWidgets();}});
  function initSampleContentWidget(reviewBox){
    const ID="mini-excel-sample-content";document.getElementById(ID)?.remove();
    const rows=[
      {id:"Tốt",text:"Cảm ơn bạn đã yêu mến và dành nhiều lời khen cho Zalopay. Chúng mình sẽ tiếp tục hoàn thiện và nâng cao chất lượng dịch vụ ngày một tốt hơn!"},
      {id:"Tệ",text:"Chúng mình rất tiếc vì trải nghiệm không tốt của bạn. Bạn vui lòng vào ứng dụng Zalopay >> chọn 'Tài khoản' >> 'Trung tâm hỗ trợ' và cung cấp thông tin liên quan để có thể được hỗ trợ nhanh nhất nhé!"}
    ];
    const wrap=document.createElement("div");
    wrap.id=ID;
    Object.assign(wrap.style,{position:"fixed",top:"10px",right:"10px",zIndex:999999,width:reviewBox.offsetWidth+"px",background:"white",border:"1px solid #e5e7eb",borderRadius:"12px",boxShadow:"0 4px 12px rgba(0,0,0,.1)",fontFamily:"Segoe UI,Roboto,Arial,sans-serif",fontSize:"16px",color:"#111827",overflow:"hidden",display:"flex",flexDirection:"column"});
    const header=document.createElement("div");header.textContent=`Mini Excel ("Ctrl + Space" để Ẩn/Hiện)`;Object.assign(header.style,{padding:"8px 12px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"space-between"});
    const closeBtn=document.createElement("button");closeBtn.textContent="×";Object.assign(closeBtn.style,{border:"none",background:"transparent",cursor:"pointer",fontSize:"18px"});closeBtn.onclick=()=>{wrap.remove();document.getElementById("mini-excel-review-links")?.remove();document.getElementById("mini-excel-floating-toggle")?.remove();};
    header.appendChild(closeBtn);
    const table=document.createElement("div");Object.assign(table.style,{display:"grid",gridTemplateColumns:"80px 60px 1fr",gridAutoRows:"minmax(50px,auto)",alignItems:"stretch"});
    rows.forEach(row=>{
      const cellBtn=document.createElement("div");Object.assign(cellBtn.style,{padding:"6px",border:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"center"});
      const btn=document.createElement("button");btn.textContent="Paste";styleBtn(btn);
      btn.onclick=()=>{
        document.querySelectorAll('textarea[aria-label="Trả lời"]').forEach(textArea=>{
          const container=textArea.closest("review,div,section")||textArea.parentElement;
          const stars=container.querySelectorAll("material-icon.star-filled").length;
          if((row.id==="Tốt"&&stars>3)||(row.id==="Tệ"&&stars<=3)){
            textArea.focus();textArea.value=row.text;
            textArea.dispatchEvent(new Event("input",{bubbles:true}));
            textArea.dispatchEvent(new Event("change",{bubbles:true}));
          }
        });
      };
      cellBtn.appendChild(btn);
      const cellId=document.createElement("div");cellId.textContent=row.id;Object.assign(cellId.style,{padding:"6px",border:"1px solid #e5e7eb",textAlign:"center",fontWeight:"600"});
      const cellText=document.createElement("div");cellText.textContent=row.text;cellText.title=row.text;Object.assign(cellText.style,{padding:"6px 8px",border:"1px solid #e5e7eb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"});
      table.append(cellBtn,cellId,cellText);
    });
    wrap.append(header,table);
    document.body.appendChild(wrap);
    wrap.style.height=wrap.scrollHeight+"px";
  }
}
initReviewLinksWidget();
})();
