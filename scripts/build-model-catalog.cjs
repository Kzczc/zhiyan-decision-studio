const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),items=JSON.parse(fs.readFileSync(path.join(root,'models.example.json'),'utf8')).models;
const catalog=items.map(({id,label,vendor,provider,model,source,requiresModelId})=>({id,label,vendor,provider,model,source,requiresModelId:!!requiresModelId}));
fs.writeFileSync(path.join(root,'docs/model-catalog.js'),'// Public, secret-free examples. Actual availability is verified on invocation.\nwindow.ZhiyanModelCatalog = '+JSON.stringify(catalog,null,2)+';\n');
console.log(catalog.length+' example models');
