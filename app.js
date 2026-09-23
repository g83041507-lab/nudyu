const products=window.PRODUCTS||[];
const SHEET_WEB_APP="https://script.google.com/macros/s/AKfycbxp7g2QjFNQE1YdZq0DtMrPJDdvhIps3QLBKp0ZzuU0e_4tm8kYVYmKmHPcPWdAjAXi/exec";
const $=s=>document.querySelector(s);
const els={search:$("#search"),results:$("#results"),cart:$("#cart"),empty:$("#empty"),checkout:$("#checkout"),count:$("#cartCount"),total:$("#totalQty"),toast:$("#toast")};
let order=JSON.parse(localStorage.getItem("order-helper-cart")||"[]");
const normalize=s=>String(s||"").toLocaleLowerCase("th").replace(/\s+/g,"");
const categoryRules=[
  {name:"ขนม",icon:"🍿",words:["ขนม","เลย์","เทสโต","ตะวัน","ปาร์ตี้","คอนเน่","คาราด้า","มันฝรั่ง","ข้าวเกรียบ","เวเฟอร์","คุกกี้","แครกเกอร์","สาหร่าย","ป๊อปคอร์น","ขนมปัง","เค้ก","โดนัท","เยลลี่","พาย","บิสกิต","โรลเลอร์","ทิวลี่","ปูไทย","ฮานามิ","โปเต้","แจ็กซ์","ชีโตส","มอลคิสท์","คอร์นพัฟ"]},
  {name:"นม",icon:"🥛",words:["นม","ดัชมิลล์","โฟร์โมสต์","หนองโพ","ไวตามิ้ลค์","แลคตาซอย","ดีน่า","แอนลีน","แอนมัม"]},
  {name:"ชา",icon:"🍵",words:["ชา","โออิชิ","อิชิตัน","ฟูจิชะ","เพียวริคุ","ลิปตัน"]},
  {name:"กาแฟ",icon:"☕",words:["กาแฟ","เนสกาแฟ","เบอร์ดี้","บอสคอฟฟี่","อาราบัส","เอสเปรสโซ","ลาเต้","คาปูชิโน่","มอคค่า"]},
  {name:"ชูกำลัง",icon:"⚡",words:["ชูกำลัง","กระทิงแดง","เรดบูล","คาราบาว","m-150","เอ็ม-150","ลิโพ","แรงเยอร์","โสมอินซัม","ลูกทุ่ง"]},
  {name:"น้ำอัดลม",icon:"🥤",words:["โค้ก","โคคาโคล่า","เป๊ปซี่","เอสโคล่า","แฟนต้า","สไปรท์","มิรินด้า","เซเว่นอัพ","รูทเบียร์","น้ำอัดลม"]},
  {name:"น้ำดื่ม",icon:"💧",words:["น้ำดื่ม","น้ำแร่","คริสตัล","สิงห์","เนสท์เล่เพียวไลฟ์","มิเนเร่","ออร่า","เพอร์ร่า"]},
  {name:"บะหมี่",icon:"🍜",words:["บะหมี่","มาม่า","ไวไว","ยำยำ","นิชชิน","คัพนู้ดเดิ้ล","โจ๊ก","วุ้นเส้น"]},
  {name:"ช็อกโกแลต",icon:"🍫",words:["ช็อกโกแลต","ช็อคโกแลต","โกโก้","คิทแคท","สนิกเกอร์","เอ็มแอนด์เอ็ม","ท็อปเบอโรน","เฟอเรโร","เฮอร์ชี่"]},
  {name:"ลูกอม",icon:"🍬",words:["ลูกอม","หมากฝรั่ง","ฮอลล์","ฟิชเชอร์แมน","คลอเร็ท","มายมิ้นท์","เมนทอส","จูปาจุ๊ปส์"]}
];
let activeCategory="";
let resultLimit=60;
const matchesCategory=(p,cat)=>{
  const rule=categoryRules.find(x=>x.name===cat);if(!rule)return false;
  const n=normalize(p.name);
  if(cat==="น้ำดื่ม"){
    const notDrink=["ครีม","โลชั่น","เซรั่ม","สบู่","แชมพู","โฟม","ทูน่า","ปลา","น้ำมัน","น้ำปลา","น้ำยา","ซอส"];
    if(notDrink.some(w=>n.includes(w)))return false;
    const drinkSize=/(มล\.?|มิลลิลิตร|ลิตร|ซีซี|cc)/i.test(p.name);
    return n.includes("น้ำดื่ม")||(drinkSize&&rule.words.some(w=>n.includes(normalize(w))));
  }
  return rule.words.some(w=>n.includes(normalize(w)));
};
els.categories=$("#categories");
els.categories.innerHTML=categoryRules.map(c=>`<button class="category" data-category="${c.name}" type="button">${c.icon} ${c.name}</button>`).join("");
function search(){
  const q=normalize(els.search.value);
  const typedCategory=categoryRules.find(c=>normalize(c.name)===q)?.name||"";
  const cat=activeCategory||typedCategory;
  document.querySelectorAll(".category").forEach(b=>b.classList.toggle("active",b.dataset.category===cat));
  if(!q&&!cat){els.results.innerHTML='<div class="hint">ข้อมูลสินค้า '+products.length.toLocaleString("th-TH")+' รายการ<br>เลือกหมวด หรือเริ่มพิมพ์ได้เลย</div>';return}
  let found;
  if(cat) found=products.filter(p=>matchesCategory(p,cat)&&(typedCategory||!q||normalize(p.name).includes(q)||p.code.includes(q)));
  else{
    const exactCode=products.filter(p=>p.code===q);
    const starts=products.filter(p=>!exactCode.includes(p)&&(normalize(p.name).startsWith(q)||p.code.startsWith(q)));
    const includes=products.filter(p=>!exactCode.includes(p)&&!starts.includes(p)&&normalize(p.name).includes(q));
    found=[...exactCode,...starts,...includes];
  }
  const shown=found.slice(0,resultLimit);
  els.results.innerHTML=found.length?'<div class="result-count">พบ '+found.length.toLocaleString("th-TH")+' รายการ · แตะเพื่อติ๊กเลือก</div>'+shown.map(p=>{const selected=order.some(x=>x.code===p.code);return `<button class="result ${selected?"selected":""}" data-code="${p.code}" type="button"><span class="tick">✓</span><div class="info"><strong>${escapeHtml(p.name)}</strong><div class="barcode">${p.code}</div></div><span class="kind">${p.kind}</span></button>`}).join("")+(found.length>shown.length?'<button class="more" data-more type="button">แสดงเพิ่มอีก '+Math.min(60,found.length-shown.length)+' รายการ</button>':''):'<div class="hint">หาไม่เจอ ลองเลือกหมวดอื่นหรือพิมพ์สั้นลง</div>';
}
function toggle(code){
  const p=products.find(x=>x.code===code); if(!p)return;
  const i=order.findIndex(x=>x.code===code);
  if(i>=0){order.splice(i,1);showToast("เอาออกแล้ว")}else{order.push({...p,qty:1});showToast("ติ๊กเลือกแล้ว")}
  render();search();
}
function render(){
  localStorage.setItem("order-helper-cart",JSON.stringify(order));
  els.empty.hidden=order.length>0;els.checkout.hidden=order.length===0;
  els.count.textContent=order.length?order.length+" รายการ":"ยังไม่มีสินค้า";
  els.total.textContent=order.length+" รายการ";
  els.cart.innerHTML=order.map((x,i)=>`<article class="cart-item"><div class="cart-top"><div><strong>${escapeHtml(x.name)}</strong><div class="barcode">${x.code}</div><span class="unit">${x.kind}</span></div><button class="remove" data-action="remove" data-i="${i}" aria-label="ลบ ${escapeHtml(x.name)}">×</button></div></article>`).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function showToast(t){els.toast.textContent=t;els.toast.classList.add("show");setTimeout(()=>els.toast.classList.remove("show"),1600)}
els.search.addEventListener("input",()=>{activeCategory="";resultLimit=60;search()});
els.categories.addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=activeCategory===b.dataset.category?"":b.dataset.category;els.search.value="";resultLimit=60;search()});
els.results.addEventListener("click",e=>{const more=e.target.closest("[data-more]");if(more){resultLimit+=60;search();return}const b=e.target.closest("[data-code]");if(b)toggle(b.dataset.code)});
els.cart.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const i=+b.dataset.i;if(b.dataset.action==="remove"){order.splice(i,1);render();search()}});
$("#copyOrder").addEventListener("click",async()=>{const text=["รายการสั่งของ",...order.map((x,i)=>`${i+1}. ${x.code} — ${x.name}`),"","รวม "+order.length+" รายการ"].join("\n");await navigator.clipboard.writeText(text);showToast("คัดลอกแล้ว ไปวางส่งได้เลย ✓")});
$("#sendSheet").addEventListener("click",async()=>{
  if(!order.length)return;
  const button=$("#sendSheet");
  button.disabled=true;
  button.textContent="กำลังส่ง…";
  try{
    await fetch(SHEET_WEB_APP,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({items:order.map(x=>({barcode:x.code||"",name:x.name}))})});
    order=[];
    localStorage.removeItem("order-helper-cart");
    render();
    search();
    button.textContent="ส่งแล้ว ✓";
    showToast("ส่งเข้าชีตแล้ว ล้างรายการให้แล้ว ✓");
    setTimeout(()=>{button.disabled=false;button.textContent="ส่งเข้าชีต"},2200);
  }catch(error){
    button.disabled=false;
    button.textContent="ส่งเข้าชีต";
    showToast("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
  }
});
$("#clearAll").addEventListener("click",()=>{
  if(!order.length||confirm("ล้างรายการทั้งหมดใช่ไหม?")){
    order=[];
    localStorage.removeItem("order-helper-cart");
    render();
    search();
    showToast("ล้างรายการและรีเซ็ตจำนวนแล้ว");
  }
});
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement!==els.search){e.preventDefault();els.search.focus()}});
search();render();

if(document.modelContext?.registerTool){
  const register=tool=>Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{});
  register({
    name:"search_products",
    title:"ค้นหาสินค้า",
    description:"ค้นหาสินค้าจากชื่อหรือเลขบาร์โค้ดในรายการสินค้าของร้าน",
    inputSchema:{type:"object",properties:{query:{type:"string"}},required:["query"],additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute({query}){if(typeof query!=="string"||!query.trim())throw new Error("กรุณาใส่คำค้น");const q=normalize(query);return products.filter(p=>p.code.includes(q)||normalize(p.name).includes(q)).slice(0,20)}
  });
  register({
    name:"add_order_items",
    title:"เพิ่มสินค้าที่จะสั่ง",
    description:"เพิ่มสินค้าหนึ่งรายการหรือหลายรายการลงในรายการสั่งของด้วยเลขบาร์โค้ดและจำนวน",
    inputSchema:{type:"object",properties:{items:{type:"array",items:{type:"object",properties:{barcode:{type:"string"},quantity:{type:"integer",minimum:1}},required:["barcode","quantity"],additionalProperties:false},minItems:1}},required:["items"],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute({items}){if(!Array.isArray(items)||!items.length)throw new Error("กรุณาใส่สินค้า");for(const item of items){const p=products.find(x=>x.code===String(item.barcode));if(!p||!Number.isInteger(item.quantity)||item.quantity<1)throw new Error("ข้อมูลสินค้าไม่ถูกต้อง")}for(const item of items){const old=order.find(x=>x.code===String(item.barcode));const p=products.find(x=>x.code===String(item.barcode));old?old.qty+=item.quantity:order.push({...p,qty:item.quantity})}render();return{itemCount:order.length,totalQuantity:order.reduce((n,x)=>n+x.qty,0)}}
  });
}
