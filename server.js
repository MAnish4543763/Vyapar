const express=require("express");
const session=require("express-session");
const bcrypt=require("bcryptjs");
const Database=require("better-sqlite3");
const path=require("path");
const app=express();
const db=new Database(path.join(__dirname,"data","bizflow.db"));
db.pragma("foreign_keys = ON");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({secret:process.env.SESSION_SECRET||"change-this-secret-in-production",resave:false,saveUninitialized:false,cookie:{httpOnly:true,maxAge:86400000}}));
app.use(express.static(path.join(__dirname,"public")));

db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,sku TEXT UNIQUE NOT NULL,category TEXT,price REAL DEFAULT 0,cost REAL DEFAULT 0,stock INTEGER DEFAULT 0,min_stock INTEGER DEFAULT 5,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS customers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT,email TEXT,address TEXT,balance REAL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS suppliers(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT,email TEXT,address TEXT,balance REAL DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS expenses(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,category TEXT,amount REAL DEFAULT 0,date TEXT,notes TEXT);
CREATE TABLE IF NOT EXISTS invoices(id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_no TEXT UNIQUE NOT NULL,customer_id INTEGER,subtotal REAL DEFAULT 0,tax REAL DEFAULT 0,discount REAL DEFAULT 0,total REAL DEFAULT 0,status TEXT DEFAULT 'Pending',date TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(customer_id) REFERENCES customers(id));
CREATE TABLE IF NOT EXISTS invoice_items(id INTEGER PRIMARY KEY AUTOINCREMENT,invoice_id INTEGER,product_id INTEGER,quantity INTEGER,price REAL,total REAL,FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id));
CREATE TABLE IF NOT EXISTS purchases(id INTEGER PRIMARY KEY AUTOINCREMENT,bill_no TEXT UNIQUE NOT NULL,supplier_id INTEGER,total REAL DEFAULT 0,status TEXT DEFAULT 'Pending',date TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(supplier_id) REFERENCES suppliers(id));
CREATE TABLE IF NOT EXISTS purchase_items(id INTEGER PRIMARY KEY AUTOINCREMENT,purchase_id INTEGER,product_id INTEGER,quantity INTEGER,cost REAL,total REAL,FOREIGN KEY(purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,FOREIGN KEY(product_id) REFERENCES products(id));
`);

const count=db.prepare("SELECT COUNT(*) c FROM users").get().c;
if(!count){
 const pw=bcrypt.hashSync("admin123",10);
 db.prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)").run("Demo Admin","admin@bizflow.local",pw);
 const products=[
  ["Premium Rice 5kg","RICE-005","Grocery",540,450,46,10],
  ["Wheat Flour 10kg","FLOUR-10","Grocery",480,390,28,8],
  ["Cooking Oil 1L","OIL-001","Grocery",165,130,9,10],
  ["Tea Premium 500g","TEA-500","Beverages",310,250,63,10],
  ["Sugar 5kg","SUGAR-005","Grocery",250,210,22,8]
 ];
 const s=db.prepare("INSERT INTO products(name,sku,category,price,cost,stock,min_stock) VALUES(?,?,?,?,?,?,?)");
 products.forEach(x=>s.run(...x));
 const cs=db.prepare("INSERT INTO customers(name,phone,email,address,balance) VALUES(?,?,?,?,?)");
 cs.run("Raj Traders","+91 98765 43210","raj@example.com","Agra",12500);
 cs.run("Amit General Store","+91 91234 56789","amit@example.com","Agra",4200);
 cs.run("Sharma Enterprises","+91 99887 66554","sharma@example.com","Mathura",8700);
 const ss=db.prepare("INSERT INTO suppliers(name,phone,email,address,balance) VALUES(?,?,?,?,?)");
 ss.run("Shree Wholesale","+91 90000 12345","supply@example.com","Delhi",18200);
 ss.run("Metro Distributors","+91 91111 45678","metro@example.com","Delhi",9600);
 db.prepare("INSERT INTO expenses(name,category,amount,date,notes) VALUES(?,?,?,?,?)").run("Shop Rent","Rent",18000,new Date().toISOString().slice(0,10),"Monthly rent");
 db.prepare("INSERT INTO expenses(name,category,amount,date,notes) VALUES(?,?,?,?,?)").run("Electricity","Utilities",4200,new Date().toISOString().slice(0,10),"Electricity bill");
}

function auth(req,res,next){if(!req.session.user)return res.status(401).json({error:"Login required"});next();}
function nextInvoice(){const n=db.prepare("SELECT COUNT(*) c FROM invoices").get().c+1025;return "INV-"+n;}
function nextBill(){const n=db.prepare("SELECT COUNT(*) c FROM purchases").get().c+500;return "PUR-"+n;}

app.post("/api/auth/login",(req,res)=>{
 const u=db.prepare("SELECT * FROM users WHERE email=?").get(req.body.email);
 if(!u||!bcrypt.compareSync(req.body.password,u.password))return res.status(401).json({error:"Invalid email or password"});
 req.session.user={id:u.id,name:u.name,email:u.email};res.json({user:req.session.user});
});
app.post("/api/auth/register",(req,res)=>{
 if(!req.body.name||!req.body.email||!req.body.password)return res.status(400).json({error:"All fields are required"});
 try{const hash=bcrypt.hashSync(req.body.password,10);const r=db.prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)").run(req.body.name,req.body.email,hash);req.session.user={id:r.lastInsertRowid,name:req.body.name,email:req.body.email};res.json({user:req.session.user});}catch(e){res.status(400).json({error:"Email already registered"});}
});
app.post("/api/auth/logout",(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get("/api/auth/me",(req,res)=>res.json({user:req.session.user||null}));

app.get("/api/dashboard",auth,(req,res)=>{
 const sales=db.prepare("SELECT COALESCE(SUM(total),0) n FROM invoices WHERE status!='Cancelled'").get().n;
 const purchases=db.prepare("SELECT COALESCE(SUM(total),0) n FROM purchases").get().n;
 const expenses=db.prepare("SELECT COALESCE(SUM(amount),0) n FROM expenses").get().n;
 const receivables=db.prepare("SELECT COALESCE(SUM(balance),0) n FROM customers").get().n;
 const stock=db.prepare("SELECT COALESCE(SUM(price*stock),0) n FROM products").get().n;
 const low=db.prepare("SELECT * FROM products WHERE stock<=min_stock ORDER BY stock ASC").all();
 const recent=db.prepare("SELECT i.*,c.name customer FROM invoices i LEFT JOIN customers c ON c.id=i.customer_id ORDER BY i.id DESC LIMIT 6").all();
 res.json({sales,purchases,expenses,receivables,stock,low,recent});
});

app.get("/api/products",auth,(req,res)=>res.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all()));
app.post("/api/products",auth,(req,res)=>{
 const b=req.body;
 try{const r=db.prepare("INSERT INTO products(name,sku,category,price,cost,stock,min_stock) VALUES(?,?,?,?,?,?,?)").run(b.name,b.sku,b.category||"General",+b.price||0,+b.cost||0,+b.stock||0,+b.min_stock||5);res.json(db.prepare("SELECT * FROM products WHERE id=?").get(r.lastInsertRowid));}catch(e){res.status(400).json({error:"SKU must be unique"});}
});
app.put("/api/products/:id",auth,(req,res)=>{
 const b=req.body;db.prepare("UPDATE products SET name=?,sku=?,category=?,price=?,cost=?,stock=?,min_stock=? WHERE id=?").run(b.name,b.sku,b.category,+b.price,+b.cost,+b.stock,+b.min_stock,+req.params.id);res.json({ok:true});
});
app.delete("/api/products/:id",auth,(req,res)=>{db.prepare("DELETE FROM products WHERE id=?").run(+req.params.id);res.json({ok:true})});

app.get("/api/customers",auth,(req,res)=>res.json(db.prepare("SELECT * FROM customers ORDER BY id DESC").all()));
app.post("/api/customers",auth,(req,res)=>{const b=req.body,r=db.prepare("INSERT INTO customers(name,phone,email,address,balance) VALUES(?,?,?,?,?)").run(b.name,b.phone,b.email,b.address,+b.balance||0);res.json(db.prepare("SELECT * FROM customers WHERE id=?").get(r.lastInsertRowid));});
app.put("/api/customers/:id",auth,(req,res)=>{const b=req.body;db.prepare("UPDATE customers SET name=?,phone=?,email=?,address=?,balance=? WHERE id=?").run(b.name,b.phone,b.email,b.address,+b.balance||0,+req.params.id);res.json({ok:true})});
app.delete("/api/customers/:id",auth,(req,res)=>{db.prepare("DELETE FROM customers WHERE id=?").run(+req.params.id);res.json({ok:true})});

app.get("/api/suppliers",auth,(req,res)=>res.json(db.prepare("SELECT * FROM suppliers ORDER BY id DESC").all()));
app.post("/api/suppliers",auth,(req,res)=>{const b=req.body,r=db.prepare("INSERT INTO suppliers(name,phone,email,address,balance) VALUES(?,?,?,?,?)").run(b.name,b.phone,b.email,b.address,+b.balance||0);res.json({id:r.lastInsertRowid});});
app.delete("/api/suppliers/:id",auth,(req,res)=>{db.prepare("DELETE FROM suppliers WHERE id=?").run(+req.params.id);res.json({ok:true})});

app.get("/api/expenses",auth,(req,res)=>res.json(db.prepare("SELECT * FROM expenses ORDER BY date DESC,id DESC").all()));
app.post("/api/expenses",auth,(req,res)=>{const b=req.body,r=db.prepare("INSERT INTO expenses(name,category,amount,date,notes) VALUES(?,?,?,?,?)").run(b.name,b.category,+b.amount||0,b.date||new Date().toISOString().slice(0,10),b.notes||"");res.json({id:r.lastInsertRowid});});
app.delete("/api/expenses/:id",auth,(req,res)=>{db.prepare("DELETE FROM expenses WHERE id=?").run(+req.params.id);res.json({ok:true})});

app.get("/api/invoices",auth,(req,res)=>res.json(db.prepare("SELECT i.*,c.name customer FROM invoices i LEFT JOIN customers c ON c.id=i.customer_id ORDER BY i.id DESC").all()));
app.get("/api/invoices/:id",auth,(req,res)=>{
 const invoice=db.prepare("SELECT i.*,c.name customer,c.phone,c.address FROM invoices i LEFT JOIN customers c ON c.id=i.customer_id WHERE i.id=?").get(+req.params.id);
 if(!invoice)return res.status(404).json({error:"Not found"});
 invoice.items=db.prepare("SELECT ii.*,p.name product,p.sku FROM invoice_items ii JOIN products p ON p.id=ii.product_id WHERE ii.invoice_id=?").all(invoice.id);res.json(invoice);
});
app.post("/api/invoices",auth,(req,res)=>{
 const b=req.body,items=b.items||[];if(!b.customer_id||!items.length)return res.status(400).json({error:"Customer and at least one item are required"});
 const tx=db.transaction(()=>{
  let subtotal=0;items.forEach(x=>subtotal+=(+x.price)*(+x.quantity));
  const discount=+b.discount||0,taxRate=+b.tax_rate||0,tax=Math.max(0,subtotal-discount)*taxRate/100,total=Math.max(0,subtotal-discount)+tax;
  const no=nextInvoice();const r=db.prepare("INSERT INTO invoices(invoice_no,customer_id,subtotal,tax,discount,total,status,date) VALUES(?,?,?,?,?,?,?,?)").run(no,+b.customer_id,subtotal,tax,discount,total,b.status||"Pending",b.date||new Date().toISOString().slice(0,10));
  const add=db.prepare("INSERT INTO invoice_items(invoice_id,product_id,quantity,price,total) VALUES(?,?,?,?,?)");const upd=db.prepare("UPDATE products SET stock=stock-? WHERE id=?");
  items.forEach(x=>{const q=+x.quantity,price=+x.price;add.run(r.lastInsertRowid,+x.product_id,q,price,q*price);upd.run(q,+x.product_id)});
  if((b.status||"Pending")!=="Paid")db.prepare("UPDATE customers SET balance=balance+? WHERE id=?").run(total,+b.customer_id);
  return r.lastInsertRowid;
 });
 try{res.json({id:tx()})}catch(e){res.status(400).json({error:e.message})}
});
app.put("/api/invoices/:id/status",auth,(req,res)=>{db.prepare("UPDATE invoices SET status=? WHERE id=?").run(req.body.status,+req.params.id);res.json({ok:true})});

app.get("/api/purchases",auth,(req,res)=>res.json(db.prepare("SELECT p.*,s.name supplier FROM purchases p LEFT JOIN suppliers s ON s.id=p.supplier_id ORDER BY p.id DESC").all()));
app.post("/api/purchases",auth,(req,res)=>{
 const b=req.body,items=b.items||[];if(!b.supplier_id||!items.length)return res.status(400).json({error:"Supplier and items required"});
 const tx=db.transaction(()=>{let total=0;items.forEach(x=>total+=(+x.cost)*(+x.quantity));const r=db.prepare("INSERT INTO purchases(bill_no,supplier_id,total,status,date) VALUES(?,?,?,?,?)").run(nextBill(),+b.supplier_id,total,b.status||"Pending",b.date||new Date().toISOString().slice(0,10));const add=db.prepare("INSERT INTO purchase_items(purchase_id,product_id,quantity,cost,total) VALUES(?,?,?,?,?)"),up=db.prepare("UPDATE products SET stock=stock+?,cost=? WHERE id=?");items.forEach(x=>{add.run(r.lastInsertRowid,+x.product_id,+x.quantity,+x.cost,+x.quantity*+x.cost);up.run(+x.quantity,+x.cost,+x.product_id)});db.prepare("UPDATE suppliers SET balance=balance+? WHERE id=?").run(total,+b.supplier_id);return r.lastInsertRowid});try{res.json({id:tx()})}catch(e){res.status(400).json({error:e.message})}
});

app.get("/api/reports",auth,(req,res)=>{
 const sales=db.prepare("SELECT COALESCE(SUM(total),0) n FROM invoices WHERE status!='Cancelled'").get().n;
 const purchases=db.prepare("SELECT COALESCE(SUM(total),0) n FROM purchases").get().n;
 const expenses=db.prepare("SELECT COALESCE(SUM(amount),0) n FROM expenses").get().n;
 const profit=sales-purchases-expenses;
 const top=db.prepare("SELECT p.name,SUM(ii.quantity) qty,SUM(ii.total) revenue FROM invoice_items ii JOIN products p ON p.id=ii.product_id JOIN invoices i ON i.id=ii.invoice_id WHERE i.status!='Cancelled' GROUP BY p.id ORDER BY revenue DESC LIMIT 8").all();
 res.json({sales,purchases,expenses,profit,top});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const PORT=process.env.PORT||3000;app.listen(PORT,()=>console.log(`BizFlow running on http://localhost:${PORT}`));