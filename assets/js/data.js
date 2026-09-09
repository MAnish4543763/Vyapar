
window.DB = {
  load(){
    const raw=localStorage.getItem('bizflow_db_v1');
    if(raw) return JSON.parse(raw);
    return {
      business:{name:'My Business',phone:'',email:'',address:'',gstin:'',state:'Uttar Pradesh',invoicePrefix:'INV'},
      products:[
        {id:'p1',name:'Premium T-Shirt',sku:'TS-001',category:'Clothing',unit:'PCS',sale:799,purchase:450,gst:18,stock:48,min:10,batch:'B-1001',expiry:''},
        {id:'p2',name:'Sports Shoes',sku:'SH-101',category:'Footwear',unit:'PAIR',sale:1499,purchase:900,gst:18,stock:18,min:8,batch:'B-2001',expiry:''},
        {id:'p3',name:'Cotton Cap',sku:'CP-010',category:'Accessories',unit:'PCS',sale:299,purchase:150,gst:12,stock:7,min:10,batch:'B-3001',expiry:''}
      ],
      parties:[
        {id:'c1',name:'Rahul Traders',type:'Customer',phone:'9876543210',email:'rahul@example.com',gstin:'',address:'Agra',opening:0},
        {id:'c2',name:'ABC Suppliers',type:'Supplier',phone:'',email:'',gstin:'',address:'Delhi',opening:0}
      ],
      sales:[],purchases:[],expenses:[],income:[],cashbank:[],quotations:[],orders:[],challans:[],
      settings:{gst:true,lowStock:true,autoBackup:false,currency:'₹',invoiceTheme:'Classic',reminders:true}
    };
  },
  save(db){localStorage.setItem('bizflow_db_v1',JSON.stringify(db));},
  id(prefix){return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
};
