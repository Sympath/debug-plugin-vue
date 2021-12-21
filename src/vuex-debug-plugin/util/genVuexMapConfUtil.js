let fs = require('fs');
let ori = require('./ori');

let obj = {};
function handler(str) {
    str.split(',').forEach(s => innerHandler(s))
    function innerHandler(innersStr) {
        let result = innersStr.replace(/\s/g, '').replace(/\\/g, '&').replace(/\n/g,'').replace(/&&/g,' && ').trim().split('|');
        result.shift();
        result.pop();
        let type;
        let moduleName;
        if(result[0].indexOf('/') !== -1){
            let infos = result[0].split('/')
             moduleName = infos[0];
             type = infos[1];
        }else {
            type = result[0];
            moduleName = '*' // 代表未记录模块信息 只要匹配上了type就行
        }
        obj[type] = {
            moduleName,
            getter:result[1],
            action:result[2],
            api:result[3],
            annotation:result[4],
            apiDocsLink:result[5],
        }
        // console.log(result);

    }
    console.log(obj);
    return `
        export default ${JSON.stringify(obj)}
    `
}





let content = handler(ori)

fs.writeFile("vuexDebugMap.config.js", content, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});