
let fs = require('fs');
let content = ''
/**
 * 入口函数
 * @param {*} baseApi 接口地址
 * @param {*} key 属性名 Getter
 * @param {*} name 属性名的注释 注释时使用
 * @param {*} mudule 属于哪个模块
 */
function main(apiInfo={},key="",name="",mudule="") {
    // 生成service层代码
    genApiService(apiInfo,key,name,mudule)
     // 引入语句的生成
    genImport(key,name,mudule); 
}
// 生成service层代码
function genApiService(apiInfo={},key="",name="",mudule="") {
    let {
        baseApi = '',
        allApi = '', // 查询所有 这个需要生成Vuex的三层模型
    } = apiInfo;
    let path = `src/services/${mudule}` // 文件路径
    let methodKey = firstToUpper(key); // 首字母大写
    // service
    let queryApi = `${baseApi}-page`,queryApiService = `apiGet${methodKey}sByPage`;
    let addApi = `${baseApi}-add`,addApiService = `apiAdd${methodKey}`;
    let modifyApi = `${baseApi}-modify`,modifyApiService = `apiDelete${methodKey}`;;
    let deleteApi = `${baseApi}-delete/\${params}`,deleteApiService = `apiUpdate${methodKey}`;
    content += ('================ Services =====', `${path}/index.js`);
    let result = `
      // ${name}信息分页查询
      ${queryApiService}: params => api.get('${queryApi}', { params }),
      // 添加${name}信息
      ${addApiService}: params => api.post('${addApi}', params),
      // 删除${name}信息
     ${deleteApiService}: params => api.post(\`${deleteApi}\`),
      // 修改${name}
      ${modifyApiService}: params => api.post('${modifyApi}', params),
    `
    // 资源点
    console.log(`
        | 地址                                           | 方法 | 名称                 |
        | ---------------------------------------------- | ---- | -------------------- |
        | ${queryApi} | get | ${name}信息分页查询 |
        | ${addApi} | post | 添加${name}信息 |
        | ${deleteApi} | post | 删除${name}信息 |
        | ${modifyApi} | post | 修改${name}信息 |
    `);
    content += (result);
    if(allApi){
        // 分页查询三层模式语句的生成
        genVuex(allApi,`all${methodKey}`,name,mudule)
    }
    return [queryApiService,addApiService,deleteApiService,modifyApiService]
}

// 生成查询的三层模型
function genVuex(allApi = '',key,name,mudule = '') {
    let path = `src/store/${mudule}`  // 文件路径
    let methodKey = firstToUpper(key); // 首字母大写
    // service
    content += (`
        // 所有${name}信息查询
        apiGet${methodKey}: params => api.get('${allApi}'),
    `);
    let type = `GET_${key.toUpperCase()}`
    content += ('================ Actions',`${path}/actions.js`);
    // Actions
    let result2 = `
        // ${name}信息查询
        async get${methodKey}({ commit }, params) {
            const response = await services.apiGet${methodKey}(params);
            commit(types.${type}, response);
            return response;
        },
    `
    content += (result2);
    content += ('================ Types');
    // Types
    let result3 = `
        ${type}: '${type}',// 查询${name}列表
    `
    content += (result3);
    content += ('================ Mutations');
    let result4 = `
        // ${name}信息查询
        [types.${type}](state, vuexData) {
            state.${key} = vuexData;
        },
    `
    content += (result4);
    content += ('================ States');
    let result5 = `
        ${key} : []  // ${name}信息查询
    `
    content += (result5);
    content += ('================ Getters');
    let result6 = `
        ${key}: state => state.${key},  // ${name}信息查询
    `
    content += (result6);
    genImportVuex(key,name,mudule)
    // 生成vuex的导入
    function genImportVuex(key,name,mudule = '') {
        let methodKey = firstToUpper(key); // 首字母大写
        content += ('================ Getters && Actions =====');
        let result2 = `
            ${key}: '${tf(mudule)}/${key}', // ${name}信息查询
            action${methodKey}: '${tf(mudule)}/get${methodKey}' // ${name}信息查询
        `
        content += (result2);
    }

}

// genVuex('/bill/medicare/miUserDiseaseInfo','diseaseInfo','医保无卡查询信息','charge')

// 生成导入
function genImport(key,name,mudule = '') {
    let methodKey = firstToUpper(key); // 首字母大写
    content += ('================ Import =====');
    let result = `
        import ${key}Services from '@/services/${mudule}';
        import {
            apiAdd${methodKey},  // 添加${name}信息
            apiDelete${methodKey}, // 删除${name}信息
            apiUpdate${methodKey},  // 修改${name}信息
            apiGet${methodKey}sByPage, // 分页查询${name}信息
        } from '@/services/${mudule}';
    `
    content += (result);
}


/**
 * 首字母转大写
 * @param {*} str 
 * @returns 
 */
function firstToUpper(str) {
    return str.trim().replace(str[0], str[0].toUpperCase());
}
function tf(str){
    var re=/-(\w)/g;
    str=str.replace(re,function($0,$1){
      return $1.toUpperCase();
    });
    return str
  };
main({
    baseApi: '/common/medicare-conf/medicare-department',
    allApi: '/basic/department/list'
},'department','医保科室','medical-insurance')

// genVuex(false,'sidebar','是否需要侧边栏','')


fs.writeFile("test.txt", content, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});

