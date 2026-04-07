// ELEMENTS
const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const search = document.getElementById("search");
const dateFilter = document.getElementById("date-filter");
const dailySearch = document.getElementById("daily-search");
const currentBalanceInput = document.getElementById("current-balance");
const setBalanceBtn = document.getElementById("set-balance-btn");
const dailyViewList = document.getElementById("daily-view-list");
const clearAllBtn = document.getElementById("clear-all-btn");
const clearHistoryBtn = document.getElementById("clear-history-btn");

// DATA
let startingBalance = parseFloat(localStorage.getItem('startingBalance')) || 0;
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let hiddenIds = JSON.parse(localStorage.getItem('hiddenIds')) || [];

// TOGGLE
let openedDate = null;
dailyViewList.style.display = "none";

// 🔥 FORMAT DATE (IMPORTANT FIX)
function formatDate(dateStr){
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
}

// GENERATE ID
function generateID(){
  return Math.floor(Math.random() * 1000000000);
}

// ADD TRANSACTION
function addTransaction(e){
  e.preventDefault();

  if(category.value.trim() === '' || amount.value === ''){
    alert('Enter category & amount');
    return;
  }

  const transaction = {
    id: generateID(),
    category: category.value,
    amount: Math.abs(+amount.value),
    date: new Date().toISOString()
  };

  transactions.push(transaction);
  updateLocalStorage();
  Init();
  form.reset();
}

// ADD TO DOM
function addTransactionDOM(transaction){

  if(hiddenIds.includes(transaction.id)) return;

  const item = document.createElement("li");
  const date = new Date(transaction.date).toLocaleString('en-IN');

  let color = transaction.category === "Extra Income" ? "green" : "red";

  item.innerHTML = `
    <div>${transaction.category}<br><small>${date}</small></div>
    <span style="color:${color}">₹${transaction.amount}</span>
    <button class="delete-btn" data-id="${transaction.id}">🗑️</button>
  `;

  item.querySelector(".delete-btn").addEventListener("click", ()=>{
    removeTransaction(transaction.id);
  });

  list.appendChild(item);
}

// VALUES
function updateValues(){
  const expenses = transactions
    .filter(t => t.category !== "Extra Income")
    .map(t => t.amount)
    .reduce((a,b)=>a+b,0);

  const total = startingBalance - expenses;

  balance.innerHTML = `₹${total}`;
  money_plus.innerHTML = `₹${startingBalance}`;
  money_minus.innerHTML = `-₹${expenses}`;
}

// DELETE (HIDE)
function removeTransaction(id){
  if(confirm("Hide this from history?")){
    hiddenIds.push(id);
    localStorage.setItem('hiddenIds', JSON.stringify(hiddenIds));
    Init();
  }
}

// STORAGE
function updateLocalStorage(){
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('startingBalance', startingBalance);
}

// 🔥 DAILY SUMMARY FIXED
function updateDailySummary(filterText=""){
  const summary = {};
  const dailyList = document.getElementById("daily-summary");

  dailyList.innerHTML = "";
  dailyViewList.innerHTML = "";
  dailyViewList.style.display = "none";

  transactions.forEach(t=>{
    const d = formatDate(t.date);

    if(!summary[d]){
      summary[d] = { income:0, expense:0, items:[] };
    }

    if(t.category === "Extra Income"){
      summary[d].income += t.amount;
    } else {
      summary[d].expense += t.amount;
    }

    summary[d].items.push(t);
  });

  Object.keys(summary).reverse().forEach(date=>{

    if(filterText && date !== filterText) return;

    const li = document.createElement("li");

    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${date}</strong><br>
      <small style="color:green">Income: ₹${summary[date].income}</small> |
      <small style="color:red">Expense: ₹${summary[date].expense}</small>
    `;

    const viewBtn = document.createElement("button");
    viewBtn.innerText = "View";
    viewBtn.classList.add("view-btn");

    viewBtn.addEventListener("click", ()=>{

      if(openedDate === date){
        dailyViewList.style.display="none";
        openedDate=null;
        viewBtn.innerText="View";
        return;
      }

      document.querySelectorAll(".view-btn").forEach(b=>b.innerText="View");

      openedDate=date;
      dailyViewList.innerHTML="";
      dailyViewList.style.display="block";
      viewBtn.innerText="Close";

      summary[date].items.forEach(t=>{
        const item=document.createElement("li");
        const time=new Date(t.date).toLocaleString('en-IN');

        let color = t.category==="Extra Income"?"green":"red";

        item.innerHTML=`
          ${t.category} - <span style="color:${color}">₹${t.amount}</span>
          <br><small>${time}</small>
        `;
        dailyViewList.appendChild(item);
      });
    });

    const downloadBtn = document.createElement("i");
    downloadBtn.className = "fa-solid fa-download download-icon";

    downloadBtn.addEventListener("click", ()=>{

      let content = `Date: ${date}\n\n`;
      content += `Income: ₹${summary[date].income}\n`;
      content += `Expense: ₹${summary[date].expense}\n\n`;

      summary[date].items.forEach(t=>{
        const time = new Date(t.date).toLocaleString('en-IN');
        content += `${t.category} - ₹${t.amount} (${time})\n`;
      });

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${date}-report.txt`;
      a.click();

      URL.revokeObjectURL(url);
    });

    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "10px";

    btnGroup.appendChild(viewBtn);
    btnGroup.appendChild(downloadBtn);

    li.appendChild(div);
    li.appendChild(btnGroup);
    dailyList.appendChild(li);
  });
}

// INIT
function Init(){
  list.innerHTML="";
  transactions.forEach(addTransactionDOM);
  updateValues();
  updateDailySummary("");
}

Init();

// EVENTS
form.addEventListener('submit', addTransaction);

// CATEGORY SEARCH
search.addEventListener("input", function(){
  const value=this.value.toLowerCase();
  list.innerHTML="";
  transactions.forEach(t=>{
    if(t.category.toLowerCase().includes(value)){
      addTransactionDOM(t);
    }
  });
});

// 🔥 DATE FILTER FIXED
dateFilter.addEventListener("change", function(){
  const selected=this.value;
  list.innerHTML="";

  transactions.forEach(t=>{
    const d = formatDate(t.date);
    if(d === selected){
      addTransactionDOM(t);
    }
  });
});

// 🔥 DAILY SEARCH FIXED
dailySearch.addEventListener("input", function(){
  updateDailySummary(this.value);
});

// SET BALANCE
setBalanceBtn.addEventListener("click", function(){
  const val=parseFloat(currentBalanceInput.value);
  if(!isNaN(val)){
    startingBalance+=val;

    const extra={
      id:generateID(),
      category:"Extra Income",
      amount:val,
      date:new Date().toISOString()
    };

    transactions.push(extra);
    updateLocalStorage();
    Init();
    currentBalanceInput.value="";
  }
});

// CLEAR HISTORY
clearHistoryBtn.addEventListener("click", function(){
  if(confirm("Clear only history?")){
    hiddenIds = transactions.map(t=>t.id);
    localStorage.setItem('hiddenIds', JSON.stringify(hiddenIds));
    Init();
  }
});

// CLEAR ALL
clearAllBtn.addEventListener("click", function(){
  if(confirm("Reset everything?")){
    transactions = [];
    startingBalance = 0;
    hiddenIds = [];
    localStorage.clear();
    Init();
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker Registered"))
    .catch(err => console.log("SW Error:", err));
}