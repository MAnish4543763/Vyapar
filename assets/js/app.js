
const db=DB.load();
let page='dashboard', searchText='';
const $=s=>document.querySelector(s);
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function save(){DB.save(db);render();}
function sum(a,k){return a.reduce((x,y)=>x+Number(y[k]||0),0)}
function salesTotal(){return sum(db.sales,'total')}
function purchaseTotal(){return sum(db.purchases,'total')}
function expensesTotal(){return sum(db.expenses,'amount')}
function stockValue(){return db.products.reduce((x,p)=>x+Number(p.stock)*Number(p.purchase),0)}
function party(id){return db.parties.find(p=>p.id===id)}
function product(id){return db.products.find(p=>p.id===id)}
function nextNo(prefix){return prefix+'-'+String((db.sales.length+db.purchases.length+db.quotations.length+db.orders.length+1)).padStart(4,'0')}

const nav=[
 ['dashboard','⌂','Dashboard'],['sales','▣','Sales'],['purchases','⇩','Purchases'],['products','▦','Products & Stock'],
 ['parties','♙','Parties'],['quotations','◇','Quotations'],['orders','☷','Orders'],['challans','▤','Delivery Challans'],
 ['expenses','−','Expenses'],['income','＋','Other Income'],['cashbank','₹','Cash & Bank'],['reports','◒','Reports'],
 ['gst','✓','GST & Tax'],['payments','◉','Payments & Dues'],['store','◫','Online Store'],['utilities','⚙','Utilities & Backup'],['settings','⚙','Settings']
];

function shell(){
 document.querySelector('#app').innerHTML=`<div class="app">
 <aside class="sidebar" id="sidebar"><div class="brand">Biz<span>Flow</span></div><div class="nav">
 <div class="nav-section">Business</div>${nav.slice(0,5).map(nbtn).join('')}
 <div class="nav-section">Transactions</div>${nav.slice(5,11).map(nbtn).join('')}
 <div class="nav-section">Insights</div>${nav.slice(11,15).map(nbtn).join('')}
 <div class="nav-section">System</div>${nav.slice(15).map(nbtn).join('')}
 </div></aside>
 <main class="main"><header class="topbar"><div style="display:flex;gap:12px;align-items:center"><button class="mobile-toggle" onclick="toggleSide()">☰</button><h2 id="top-title">Dashboard</h2></div><div class="actions"><button class="btn" onclick="quickSearch()">⌕ Search</button><button class="btn primary" onclick="openSale()">+ New Sale</button></div></header><section class="content" id="content"></section></main>
 </div><div class="modal-bg" id="modal"><div class="modal" id="modal-inner"></div></div>`;
}
function nbtn(n){return `<button class="${page===n[0]?'active':''}" onclick="go('${n[0]}')"><span class="nav-icon">${n[1]}</span>${n[2]}</button>`}
function toggleSide(){$('#sidebar').classList.toggle('open')}
function go(p){page=p;searchText='';render();$('#sidebar')?.classList.remove('open')}
function render(){shell();const title=nav.find(n=>n[0]===page)?.[2]||'Dashboard';$('#top-title').textContent=title;({dashboard:dashboard,sales:sales,purchases:purchases,products:products,parties:parties,quotations:quotations,orders:orders,challans:challans,expenses:expenses,income:income,cashbank:cashbank,reports:reports,gst:gst,payments:payments,store:store,utilities:utilities,settings:settings}[page])()}
function dashboard(){
 const low=db.products.filter(p=>Number(p.stock)<=Number(p.min));
 const profit=salesTotal()-purchaseTotal()-expensesTotal();
 $('#content').innerHTML=`<div class="page-head"><div><h1>Business Dashboard</h1><div class="muted">${esc(db.business.name)} · ${today()}</div></div><div class="actions"><button class="btn" onclick="openExpense()">Record Expense</button><button class="btn primary" onclick="openSale()">Create Invoice</button></div></div>
 <div class="cards">
 ${kpi('Sales',money(salesTotal()),db.sales.length+' invoices','blue')}
 ${kpi('Purchases',money(purchaseTotal()),db.purchases.length+' bills','')}
 ${kpi('Stock Value',money(stockValue()),db.products.length+' products','')}
 ${kpi('Net Profit',money(profit),'Sales − purchases − expenses',profit>=0?'green':'red')}
 </div>
 ${low.length?`<div class="alert" style="margin-top:18px"><b>Low stock:</b> ${low.map(p=>esc(p.name)+' ('+p.stock+')').join(', ')}</div>`:''}
 <div class="grid2"><div class="card"><div class="page-head"><h3>Recent Sales</h3><button class="btn sm" onclick="go('sales')">View all</button></div>${salesTable(db.sales.slice(-6).reverse())}</div>
 <div class="card"><h3>Quick actions</h3><div class="quick"><button onclick="openSale()">🧾<br><b>New Sale</b></button><button onclick="openPurchase()">📦<br><b>Purchase</b></button><button onclick="openProduct()">➕<br><b>Add Product</b></button><button onclick="openParty()">♙<br><b>Add Party</b></button></div><h3 style="margin-top:20px">Business status</h3><div class="muted">Cash & bank: <b>${money(sum(db.cashbank.filter(x=>x.mode==='in'),'amount')-sum(db.cashbank.filter(x=>x.mode==='out'),'amount'))}</b></div><div style="margin-top:10px">Inventory health</div><div class="progress"><i style="width:${Math.max(5,Math.min(100,100-low.length/Math.max(1,db.products.length)*100))}%"></i></div></div></div>`;
}
function kpi(label,value,sub,cls){return `<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="sub ${cls==='red'?'badge red':cls==='green'?'badge green':'muted'}">${sub}</div></div>`}

function sales(){
 $('#content').innerHTML=`<div class="page-head"><div><h1>Sales</h1><div class="muted">Invoices, POS sales, receipts and customer dues</div></div><button class="btn primary" onclick="openSale()">+ New Sale Invoice</button></div>
 <div class="card"><div class="actions" style="margin-bottom:12px"><input class="search" placeholder="Search invoice/customer..." oninput="filterTable(this.value)" value="${esc(searchText)}"><button class="btn" onclick="exportCSV('sales')">Export CSV</button></div>${salesTable(db.sales.filter(x=>JSON.stringify(x).toLowerCase().includes(searchText.toLowerCase())).reverse())}</div>`;
}
function salesTable(rows){if(!rows.length)return '<div class="empty">No sales yet. Create your first invoice.</div>';return `<div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td><b>${esc(s.no)}</b></td><td>${s.date}</td><td>${esc(party(s.partyId)?.name||'Walk-in')}</td><td>${s.items.length}</td><td>${money(s.total)}</td><td>${esc(s.payment)}</td><td>${s.paid>=s.total?'<span class="badge green">Paid</span>':'<span class="badge yellow">Due '+money(s.total-s.paid)+'</span>'}</td><td><button class="btn sm" onclick="printInvoice('${s.id}')">Print</button></td></tr>`).join('')}</tbody></table></div>`}
function filterTable(v){searchText=v; if(page==='sales')sales(); else if(page==='products')products(); else if(page==='parties')parties()}

function products(){
 const rows=db.products.filter(p=>JSON.stringify(p).toLowerCase().includes(searchText.toLowerCase()));
 $('#content').innerHTML=`<div class="page-head"><div><h1>Products & Stock</h1><div class="muted">Inventory, pricing, tax, batch and expiry tracking</div></div><button class="btn primary" onclick="openProduct()">+ Add Product</button></div>
 <div class="card"><div class="actions" style="margin-bottom:12px"><input class="search" placeholder="Search products / SKU / category..." oninput="filterTable(this.value)" value="${esc(searchText)}"><button class="btn" onclick="barcodeModal()">Barcode Generator</button><button class="btn" onclick="exportCSV('products')">Export CSV</button></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Sale</th><th>Purchase</th><th>GST</th><th>Stock</th><th>Value</th><th>Batch/Expiry</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.sku)}</td><td>${esc(p.category)}</td><td>${money(p.sale)}</td><td>${money(p.purchase)}</td><td>${p.gst}%</td><td>${Number(p.stock)<=Number(p.min)?'<span class="badge red">'+p.stock+' LOW</span>':p.stock}</td><td>${money(p.stock*p.purchase)}</td><td>${esc(p.batch||'-')} ${p.expiry?'/ '+p.expiry:''}</td><td><button class="btn sm" onclick="openProduct('${p.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

function parties(){
 const rows=db.parties.filter(p=>JSON.stringify(p).toLowerCase().includes(searchText.toLowerCase()));
 $('#content').innerHTML=`<div class="page-head"><div><h1>Parties</h1><div class="muted">Customers, suppliers, ledgers and outstanding balances</div></div><button class="btn primary" onclick="openParty()">+ Add Party</button></div><div class="card"><div class="actions" style="margin-bottom:12px"><input class="search" placeholder="Search party..." oninput="filterTable(this.value)" value="${esc(searchText)}"><button class="btn" onclick="exportCSV('parties')">Export CSV</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Type</th><th>Phone</th><th>GSTIN</th><th>Address</th><th>Balance</th><th></th></tr></thead><tbody>${rows.map(p=>`<tr><td><b>${esc(p.name)}</b></td><td><span class="badge ${p.type==='Customer'?'blue':'yellow'}">${p.type}</span></td><td>${esc(p.phone)}</td><td>${esc(p.gstin||'-')}</td><td>${esc(p.address||'-')}</td><td>${money(p.opening||0)}</td><td><button class="btn sm" onclick="openParty('${p.id}')">Edit</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

function purchases(){
 $('#content').innerHTML=`<div class="page-head"><div><h1>Purchases</h1><div class="muted">Supplier bills and stock receiving</div></div><button class="btn primary" onclick="openPurchase()">+ New Purchase</button></div><div class="card">${purchaseTable(db.purchases.slice().reverse())}</div>`;
}
function purchaseTable(rows){if(!rows.length)return '<div class="empty">No purchase bills yet.</div>';return `<div class="table-wrap"><table class="table"><thead><tr><th>Bill</th><th>Date</th><th>Supplier</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.no)}</td><td>${x.date}</td><td>${esc(party(x.partyId)?.name||'-')}</td><td>${money(x.total)}</td><td>${money(x.paid)}</td><td>${money(x.total-x.paid)}</td></tr>`).join('')}</tbody></table></div>`}

function simpleList(title,desc,rows,columns,button){
 $('#content').innerHTML=`<div class="page-head"><div><h1>${title}</h1><div class="muted">${desc}</div></div>${button||''}</div><div class="card">${rows.length?`<div class="table-wrap"><table class="table"><thead><tr>${columns.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:'<div class="empty">Nothing recorded yet.</div>'}</div>`;
}
function quotations(){simpleList('Quotations','Create estimates and convert them into sales',db.quotations.map(q=>`<tr><td>${q.no}</td><td>${q.date}</td><td>${esc(party(q.partyId)?.name||'-')}</td><td>${money(q.total)}</td><td><span class="badge blue">${q.status}</span></td></tr>`),['Quotation','Date','Customer','Total','Status'],'<button class="btn primary" onclick="openQuote()">+ New Quotation</button>')}
function orders(){simpleList('Orders','Sales and purchase order tracking',db.orders.map(q=>`<tr><td>${q.no}</td><td>${q.type}</td><td>${q.date}</td><td>${esc(party(q.partyId)?.name||'-')}</td><td>${money(q.total)}</td><td><span class="badge yellow">${q.status}</span></td></tr>`),['Order','Type','Date','Party','Total','Status'],'<button class="btn primary" onclick="openOrder()">+ New Order</button>')}
function challans(){simpleList('Delivery Challans','Dispatch goods before invoicing',db.challans.map(q=>`<tr><td>${q.no}</td><td>${q.date}</td><td>${esc(party(q.partyId)?.name||'-')}</td><td>${q.items.length}</td><td>${q.status}</td></tr>`),['Challan','Date','Party','Items','Status'],'<button class="btn primary" onclick="openChallan()">+ New Challan</button>')}
function expenses(){simpleList('Expenses','Business expenses and categories',db.expenses.map(x=>`<tr><td>${x.date}</td><td>${esc(x.category)}</td><td>${esc(x.note||'')}</td><td>${money(x.amount)}</td></tr>`),['Date','Category','Note','Amount'],'<button class="btn primary" onclick="openExpense()">+ Add Expense</button>')}
function income(){simpleList('Other Income','Record income outside normal sales',db.income.map(x=>`<tr><td>${x.date}</td><td>${esc(x.category)}</td><td>${esc(x.note||'')}</td><td>${money(x.amount)}</td></tr>`),['Date','Category','Note','Amount'],'<button class="btn primary" onclick="openIncome()">+ Add Income</button>')}
function cashbank(){simpleList('Cash & Bank','Cash book, deposits, withdrawals and transfers',db.cashbank.slice().reverse().map(x=>`<tr><td>${x.date}</td><td>${esc(x.account)}</td><td>${esc(x.mode)}</td><td>${esc(x.note||'')}</td><td>${money(x.amount)}</td></tr>`),['Date','Account','Flow','Note','Amount'],'<button class="btn primary" onclick="openCash()">+ Record Transaction</button>')}
function payments(){
 const dues=[...db.sales.map(s=>({no:s.no,type:'Receivable',party:party(s.partyId)?.name||'Walk-in',amount:s.total-s.paid})),...db.purchases.map(s=>({no:s.no,type:'Payable',party:party(s.partyId)?.name||'-',amount:s.total-s.paid}))].filter(x=>x.amount>0);
 simpleList('Payments & Dues','Receivables, payables and payment follow-up',dues.map(x=>`<tr><td>${x.no}</td><td><span class="badge ${x.type==='Receivable'?'green':'yellow'}">${x.type}</span></td><td>${esc(x.party)}</td><td>${money(x.amount)}</td><td><button class="btn sm" onclick="alert('Reminder prepared for '+${JSON.stringify(x.party)})">Remind</button></td></tr>`),['Document','Type','Party','Due','Action']);
}
function store(){
 $('#content').innerHTML=`<div class="page-head"><div><h1>Online Store</h1><div class="muted">Shareable product catalog prototype</div></div><button class="btn primary" onclick="alert('Catalog link copied (demo). Connect a backend/domain for a real store.')">Share Store</button></div><div class="cards">${db.products.map(p=>`<div class="card"><div class="logo-box">▦</div><h3>${esc(p.name)}</h3><div class="muted">${esc(p.category)} · ${p.stock} in stock</div><h2>${money(p.sale)}</h2><button class="btn primary" onclick="alert('Product added to demo cart')">Add to cart</button></div>`).join('')}</div>`;
}
function utilities(){
 $('#content').innerHTML=`<div class="page-head"><div><h1>Utilities & Backup</h1><div class="muted">Data tools, imports, exports and business utilities</div></div></div><div class="grid2">
 <div class="card"><h3>Backup & Restore</h3><p class="muted">Export your complete local database to a JSON file or restore it later.</p><div class="actions"><button class="btn primary" onclick="backup()">Download Backup</button><button class="btn" onclick="$('#restoreFile').click()">Restore Backup</button><input id="restoreFile" type="file" accept=".json" hidden onchange="restore(this)"></div></div>
 <div class="card"><h3>Data Export</h3><p class="muted">Export common records as CSV.</p><div class="actions"><button class="btn" onclick="exportCSV('sales')">Sales CSV</button><button class="btn" onclick="exportCSV('products')">Products CSV</button><button class="btn" onclick="exportCSV('parties')">Parties CSV</button></div></div>
 </div><div class="grid3"><div class="card"><h3>Barcode</h3><p class="muted">Create printable barcode labels from SKU.</p><button class="btn" onclick="barcodeModal()">Open Barcode Tool</button></div><div class="card"><h3>Invoice Preview</h3><p class="muted">Print any saved invoice using the browser print dialog.</p><button class="btn" onclick="db.sales[0]?printInvoice(db.sales[0].id):alert('Create a sale first')">Print Latest</button></div><div class="card"><h3>Reset Demo</h3><p class="muted">Restore sample business data.</p><button class="btn danger" onclick="if(confirm('Reset all local data?')){localStorage.removeItem('bizflow_db_v1');location.reload()}">Reset Data</button></div></div>`;
}
function settings(){
 $('#content').innerHTML=`<div class="page-head"><div><h1>Settings</h1><div class="muted">Business profile, GST, invoice and system preferences</div></div><button class="btn primary" onclick="saveSettings()">Save Settings</button></div>
 <div class="card"><h3>Business profile</h3><div class="form-grid">
 ${field('Business Name','bizName',db.business.name)}${field('Phone','bizPhone',db.business.phone)}${field('Email','bizEmail',db.business.email)}${field('GSTIN','bizGstin',db.business.gstin)}${field('State','bizState',db.business.state)}${field('Invoice Prefix','bizPrefix',db.business.invoicePrefix)}${field('Address','bizAddress',db.business.address,'',true)}
 </div></div><div class="card" style="margin-top:18px"><h3>Preferences</h3><div class="form-grid">
 ${selectField('GST Enabled','gst',db.settings.gst? 'yes':'no',[['yes','Enabled'],['no','Disabled']])}${selectField('Low Stock Alerts','low',db.settings.lowStock?'yes':'no',[['yes','Enabled'],['no','Disabled']])}${selectField('Auto Backup','auto',db.settings.autoBackup?'yes':'no',[['yes','Enabled'],['no','Disabled']])}${selectField('Invoice Theme','theme',db.settings.invoiceTheme,[['Classic','Classic'],['Modern','Modern'],['Minimal','Minimal']])}
 </div></div>`;
}
function field(label,id,val='',type='',full=false){return `<div class="field ${full?'full':''}"><label>${label}</label><input id="${id}" type="${type||'text'}" value="${esc(val)}"></div>`}
function selectField(label,id,val,opts){return `<div class="field"><label>${label}</label><select id="${id}">${opts.map(o=>`<option value="${o[0]}" ${o[0]===val?'selected':''}>${o[1]}</option>`).join('')}</select></div>`}
function saveSettings(){Object.assign(db.business,{name:$('#bizName').value,phone:$('#bizPhone').value,email:$('#bizEmail').value,gstin:$('#bizGstin').value,state:$('#bizState').value,invoicePrefix:$('#bizPrefix').value,address:$('#bizAddress').value});Object.assign(db.settings,{gst:$('#gst').value==='yes',lowStock:$('#low').value==='yes',autoBackup:$('#auto').value==='yes',invoiceTheme:$('#theme').value});save();alert('Settings saved');}
function reports(){
 const profit=salesTotal()-purchaseTotal()-expensesTotal();
 $('#content').innerHTML=`<div class="page-head"><div><h1>Reports & Analytics</h1><div class="muted">Business, transaction, stock, tax and financial reports</div></div><button class="btn" onclick="exportCSV('sales')">Export Sales</button></div>
 <div class="cards">${kpi('Sales',money(salesTotal()),'All invoices','')}${kpi('Purchases',money(purchaseTotal()),'All bills','')}${kpi('Expenses',money(expensesTotal()),'Recorded expenses','')}${kpi('Profit',money(profit),'Estimated gross operating result',profit>=0?'green':'red')}</div>
 <div class="grid2"><div class="card"><h3>Report Center</h3><div class="quick">
 ${reportBtn('Sales Report',()=>sales())}${reportBtn('Purchase Report',()=>purchases())}${reportBtn('Stock Summary',()=>products())}${reportBtn('Party Ledger',()=>parties())}${reportBtn('Profit & Loss',()=>profitReport())}${reportBtn('Cash Flow',()=>cashbank())}${reportBtn('Expense Report',()=>expenses())}${reportBtn('Tax Summary',()=>gst())}
 </div></div><div class="card"><h3>Top products by stock value</h3>${db.products.slice().sort((a,b)=>b.stock*b.purchase-a.stock*a.purchase).slice(0,6).map(p=>`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><span>${esc(p.name)}</span><b>${money(p.stock*p.purchase)}</b></div>`).join('')}</div></div>`;
}
function reportBtn(t,fn){return `<button onclick="(${fn.toString()})()"><b>${t}</b><br><span class="muted">Open report</span></button>`}
function profitReport(){alert(`Profit & Loss\\nSales: ${money(salesTotal())}\\nPurchases: ${money(purchaseTotal())}\\nExpenses: ${money(expensesTotal())}\\nNet: ${money(salesTotal()-purchaseTotal()-expensesTotal())}`)}
function gst(){
 const taxable=db.sales.reduce((x,s)=>x+s.subtotal,0), tax=db.sales.reduce((x,s)=>x+s.tax,0);
 $('#content').innerHTML=`<div class="page-head"><div><h1>GST & Tax</h1><div class="muted">GST summaries and HSN-oriented sales overview</div></div></div>
 <div class="cards">${kpi('Taxable Sales',money(taxable),'Sales before GST','')}${kpi('Output GST',money(tax),'GST on sales','green')}${kpi('Invoices',db.sales.length,'Sales documents','')}${kpi('GSTIN',db.business.gstin||'Not set','Business profile','')}</div>
 <div class="grid3"><div class="card"><h3>GSTR-1</h3><p class="muted">Outward supplies summary.</p><b>${money(taxable)}</b><br><button class="btn" style="margin-top:10px" onclick="exportCSV('sales')">Export Sales Data</button></div><div class="card"><h3>GSTR-3B</h3><p class="muted">Tax liability summary.</p><b>Output GST: ${money(tax)}</b></div><div class="card"><h3>GSTR-9</h3><p class="muted">Annual report placeholder.</p><button class="btn" onclick="alert('Annual filing workflow requires GST portal/API integration.')">Open</button></div></div>
 <div class="card" style="margin-top:18px"><h3>Tax by GST rate</h3>${[0,5,12,18,28].map(r=>{let a=0,t=0;db.sales.forEach(s=>s.items.forEach(i=>{if(Number(i.gst)===r){a+=i.qty*i.price;t+=i.qty*i.price*i.gst/100}}));return `<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid var(--border)"><span>GST ${r}%</span><b>${money(t)}</b></div>`}).join('')}</div>`;
}
function fieldModal(title,body,foot){$('#modal-inner').innerHTML=`<div class="modal-head"><h3>${title}</h3><button class="btn sm" onclick="closeModal()">✕</button></div><div class="modal-body">${body}</div><div class="modal-foot">${foot||'<button class="btn" onclick="closeModal()">Cancel</button>'}</div>`;$('#modal').classList.add('show')}
function closeModal(){$('#modal').classList.remove('show')}
$('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal()})

function openProduct(id){
 const p=id?product(id):{name:'',sku:'',category:'',unit:'PCS',sale:0,purchase:0,gst:18,stock:0,min:5,batch:'',expiry:''};
 fieldModal(id?'Edit Product':'Add Product',`<div class="form-grid">${field('Product Name','pn',p.name)}${field('SKU / Barcode','psku',p.sku)}${field('Category','pcat',p.category)}${field('Unit','punit',p.unit)}${field('Sale Price','psale',p.sale,'number')}${field('Purchase Price','ppur',p.purchase,'number')}${field('GST %','pgst',p.gst,'number')}${field('Opening Stock','pstock',p.stock,'number')}${field('Minimum Stock','pmin',p.min,'number')}${field('Batch No.','pbatch',p.batch)}${field('Expiry Date','pexp',p.expiry,'date')}</div>`,
 `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveProduct('${id||''}')">Save Product</button>`);
}
function saveProduct(id){const o={name:$('#pn').value,sku:$('#psku').value,category:$('#pcat').value,unit:$('#punit').value,sale:+$('#psale').value,purchase:+$('#ppur').value,gst:+$('#pgst').value,stock:+$('#pstock').value,min:+$('#pmin').value,batch:$('#pbatch').value,expiry:$('#pexp').value};if(id)Object.assign(product(id),o);else{o.id=DB.id('p');db.products.push(o)}closeModal();save()}

function openParty(id){
 const p=id?party(id):{name:'',type:'Customer',phone:'',email:'',gstin:'',address:'',opening:0};
 fieldModal(id?'Edit Party':'Add Party',`<div class="form-grid">${field('Name','pnm',p.name)}${selectField('Type','pty',p.type,[['Customer','Customer'],['Supplier','Supplier']])}${field('Phone','pph',p.phone)}${field('Email','pem',p.email,'email')}${field('GSTIN','pgin',p.gstin)}${field('Opening Balance','pop',p.opening,'number')}${field('Address','pad',p.address,'',true)}</div>`,
 `<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveParty('${id||''}')">Save Party</button>`);
}
function saveParty(id){const o={name:$('#pnm').value,type:$('#pty').value,phone:$('#pph').value,email:$('#pem').value,gstin:$('#pgin').value,address:$('#pad').value,opening:+$('#pop').value};if(id)Object.assign(party(id),o);else{o.id=DB.id('c');db.parties.push(o)}closeModal();save()}

function invoiceEditor(kind='sale'){
 const isSale=kind==='sale', list=isSale?db.parties.filter(p=>p.type==='Customer'):db.parties.filter(p=>p.type==='Supplier');
 const items=[{productId:db.products[0]?.id||'',qty:1,price:db.products[0]?.[isSale?'sale':'purchase']||0,gst:db.products[0]?.gst||0,discount:0}];
 const modal=`<div class="form-grid">${field(isSale?'Invoice No.':'Bill No.','ino',nextNo(isSale?db.business.invoicePrefix:'PUR'))}${field('Date','idate',today(),'date')}${`<div class="field"><label>${isSale?'Customer':'Supplier'}</label><select id="iparty">${list.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>`}<div class="field"><label>Payment</label><select id="ipay"><option>Cash</option><option>UPI</option><option>Bank</option><option>Credit</option></select></div></div>
 <h4>Items</h4><table class="invoice-items"><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Discount</th><th>Total</th><th></th></tr></thead><tbody id="itemsBody"></tbody></table><button class="btn sm" style="margin-top:10px" onclick="addInvoiceRow()">+ Add Item</button><div class="total-box" id="invoiceTotals"></div>`;
 fieldModal(isSale?'New Sales Invoice':'New Purchase Bill',modal,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveInvoice('${kind}')">Save ${isSale?'Invoice':'Purchase'}</button>`);
 window._invoiceItems=items; renderInvoiceRows();
}
function addInvoiceRow(){window._invoiceItems.push({productId:db.products[0]?.id||'',qty:1,price:db.products[0]?.sale||0,gst:db.products[0]?.gst||0,discount:0});renderInvoiceRows()}
function renderInvoiceRows(){
 const sale=$('#ino')?.value?.startsWith(db.business.invoicePrefix);if(!$('#itemsBody'))return;
 $('#itemsBody').innerHTML=window._invoiceItems.map((i,n)=>`<tr><td><select onchange="rowChange(${n},this.value)">${db.products.map(p=>`<option value="${p.id}" ${p.id===i.productId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></td><td><input type="number" min="1" value="${i.qty}" onchange="rowSet(${n},'qty',this.value)"></td><td><input type="number" value="${i.price}" onchange="rowSet(${n},'price',this.value)"></td><td><input type="number" value="${i.gst}" onchange="rowSet(${n},'gst',this.value)"></td><td><input type="number" value="${i.discount}" onchange="rowSet(${n},'discount',this.value)"></td><td>${money(lineTotal(i))}</td><td><button class="btn sm danger" onclick="window._invoiceItems.splice(${n},1);renderInvoiceRows()">×</button></td></tr>`).join('');
 let sub=sumItems('subtotal'),tax=sumItems('tax');$('#invoiceTotals').innerHTML=`<div class="total-row"><span>Subtotal</span><b>${money(sub)}</b></div><div class="total-row"><span>GST</span><b>${money(tax)}</b></div><div class="total-row final"><span>Total</span><b>${money(sub+tax)}</b></div>`;
}
function rowSet(n,k,v){window._invoiceItems[n][k]=+v;renderInvoiceRows()}
function rowChange(n,v){const p=product(v),i=window._invoiceItems[n];i.productId=v;i.price=p?.sale||0;i.gst=p?.gst||0;renderInvoiceRows()}
function lineTotal(i){const gross=+i.qty*+i.price,discount=gross*(+i.discount||0)/100;return gross-discount}
function sumItems(k){return window._invoiceItems.reduce((a,i)=>a+(k==='tax'?lineTotal(i)*i.gst/100:lineTotal(i)),0)}
function openSale(){invoiceEditor('sale')} function openPurchase(){invoiceEditor('purchase')}
function saveInvoice(kind){
 const isSale=kind==='sale',sub=sumItems('subtotal'),tax=sumItems('tax'),total=sub+tax, o={id:DB.id(isSale?'s':'b'),no:$('#ino').value,date:$('#idate').value,partyId:$('#iparty').value,items:JSON.parse(JSON.stringify(window._invoiceItems)),subtotal:sub,tax,total,paid:$('#ipay').value==='Credit'?0:total,payment:$('#ipay').value};
 if(isSale){db.sales.push(o);o.items.forEach(i=>{const p=product(i.productId);if(p)p.stock-=i.qty})}else{db.purchases.push(o);o.items.forEach(i=>{const p=product(i.productId);if(p)p.stock+=i.qty})}
 closeModal();save();
}
function openExpense(){fieldModal('Record Expense',`<div class="form-grid">${field('Date','edate',today(),'date')}${field('Category','ecat','General')}${field('Amount','eamt',0,'number')}${field('Note','enote','')}</div>`,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveExpense()">Save</button>`)}
function saveExpense(){db.expenses.push({id:DB.id('e'),date:$('#edate').value,category:$('#ecat').value,amount:+$('#eamt').value,note:$('#enote').value});closeModal();save()}
function openIncome(){fieldModal('Record Other Income',`<div class="form-grid">${field('Date','iodate',today(),'date')}${field('Category','ioc','Other Income')}${field('Amount','ioamt',0,'number')}${field('Note','ionote','')}</div>`,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveIncome()">Save</button>`)}
function saveIncome(){db.income.push({id:DB.id('i'),date:$('#iodate').value,category:$('#ioc').value,amount:+$('#ioamt').value,note:$('#ionote').value});closeModal();save()}
function openCash(){fieldModal('Cash / Bank Transaction',`<div class="form-grid">${field('Date','cdate',today(),'date')}${field('Account','cacc','Cash')}${selectField('Flow','cmode','in',[['in','Money In'],['out','Money Out']])}${field('Amount','camt',0,'number')}${field('Note','cnote','')}</div>`,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveCash()">Save</button>`)}
function saveCash(){db.cashbank.push({id:DB.id('cb'),date:$('#cdate').value,account:$('#cacc').value,mode:$('#cmode').value,amount:+$('#camt').value,note:$('#cnote').value});closeModal();save()}
function openQuote(){fieldModal('New Quotation',`<div class="form-grid">${field('Quotation No.','qno',nextNo('QUO'))}${field('Date','qdate',today(),'date')}<div class="field"><label>Customer</label><select id="qparty">${db.parties.filter(p=>p.type==='Customer').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>${field('Amount','qamt',0,'number')}</div>`,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveQuote()">Save</button>`)}
function saveQuote(){db.quotations.push({id:DB.id('q'),no:$('#qno').value,date:$('#qdate').value,partyId:$('#qparty').value,total:+$('#qamt').value,status:'Sent'});closeModal();save()}
function openOrder(){fieldModal('New Order',`<div class="form-grid">${field('Order No.','ono',nextNo('ORD'))}${field('Date','odate',today(),'date')}${selectField('Type','otype','Sales',[['Sales','Sales'],['Purchase','Purchase']])}<div class="field"><label>Party</label><select id="oparty">${db.parties.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>${field('Amount','oamt',0,'number')}</div>`,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveOrder()">Save</button>`)}
function saveOrder(){db.orders.push({id:DB.id('o'),no:$('#ono').value,date:$('#odate').value,type:$('#otype').value,partyId:$('#oparty').value,total:+$('#oamt').value,status:'Open'});closeModal();save()}
function openChallan(){fieldModal('New Delivery Challan',`<div class="form-grid">${field('Challan No.','dno',nextNo('DC'))}${field('Date','ddate',today(),'date')}<div class="field"><label>Party</label><select id="dparty">${db.parties.filter(p=>p.type==='Customer').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>${field('Items / Description','ditems','')}${field('Quantity','dqty',1,'number')}</div>`,`<button class="btn" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveChallan()">Save</button>`)}
function saveChallan(){db.challans.push({id:DB.id('d'),no:$('#dno').value,date:$('#ddate').value,partyId:$('#dparty').value,items:[{description:$('#ditems').value,qty:+$('#dqty').value}],status:'Delivered'});closeModal();save()}
function barcodeModal(){fieldModal('Barcode Generator',`<div class="form-grid">${field('Product / SKU','bsku',db.products[0]?.sku||'')}</div><div style="font-family:monospace;font-size:35px;letter-spacing:6px;text-align:center;padding:25px">|||| ||| |||| || |||</div><div class="muted" style="text-align:center">Demo barcode preview. Connect a barcode library/printer for production labels.</div>`,`<button class="btn" onclick="closeModal()">Close</button><button class="btn primary" onclick="window.print()">Print</button>`)}
function printInvoice(id){
 const s=db.sales.find(x=>x.id===id);if(!s)return;
 const w=window.open('','_blank');w.document.write(`<html><head><title>${s.no}</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.total{text-align:right;margin-top:20px;font-size:18px}</style></head><body><h1>${esc(db.business.name)}</h1><p>${esc(db.business.address)}<br>${esc(db.business.phone)} ${db.business.gstin?'· GSTIN '+esc(db.business.gstin):''}</p><hr><h2>Tax Invoice</h2><p><b>Invoice:</b> ${esc(s.no)} &nbsp; <b>Date:</b> ${s.date}</p><p><b>Customer:</b> ${esc(party(s.partyId)?.name||'Walk-in')}</p><table><tr><th>Item</th><th>Qty</th><th>Rate</th><th>GST</th><th>Total</th></tr>${s.items.map(i=>`<tr><td>${esc(product(i.productId)?.name||'-')}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${i.gst}%</td><td>${money(lineTotal(i)+lineTotal(i)*i.gst/100)}</td></tr>`).join('')}</table><div class="total"><b>Subtotal:</b> ${money(s.subtotal)}<br><b>GST:</b> ${money(s.tax)}<br><b>Grand Total:</b> ${money(s.total)}</div><p>Payment: ${esc(s.payment)}</p><script>window.print()</script></body></html>`);w.document.close();
}
function backup(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bizflow-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href)}
function restore(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);Object.keys(db).forEach(k=>delete db[k]);Object.assign(db,x);DB.save(db);location.reload()}catch(e){alert('Invalid backup file')}};r.readAsText(f)}
function exportCSV(type){const arr=db[type]||[];if(!arr.length){alert('No data to export');return}const keys=Object.keys(arr[0]).filter(k=>typeof arr[0][k]!=='object');const csv=[keys.join(','),...arr.map(o=>keys.map(k=>`"${String(o[k]??'').replaceAll('"','""')}"`).join(','))].join('\\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=type+'.csv';a.click()}
function quickSearch(){const q=prompt('Search products, parties, invoices or pages');if(!q)return;const l=q.toLowerCase();const hit=db.products.find(p=>p.name.toLowerCase().includes(l)||p.sku.toLowerCase().includes(l))||db.parties.find(p=>p.name.toLowerCase().includes(l));if(hit)alert('Found: '+(hit.name||hit.sku));else alert('No matching record found')}
render();
