
/**
      * 深度去除对象中为空的参数  递归  避免传空时后台未考虑此逻辑而出错
      * obj  需清理的对象
      */
function delDeep(obj){
  eachObj(obj,(key, value) => {
    if(!value){
         delete obj[key]
    }else if(typeof element === 'object'){
         delDeep(element)
    }else {

    }
  })
}
// 保证数组的push参数只有一个对象
export function mergeArr(ori = [],tar = []) {
  tar.forEach(item=>{
    ori.push(item)
  })
}

/**
 * 遍历对象 直接获取key value  （不会遍历原型链  forin会）
 * @param {*} obj 被遍历对象
 * @param {*} cb 回调
 */
export function eachObj(obj,cb){
  if(typeCheck('Map')(obj)){
    for (let [key, value] of obj) {
      cb(key,value);
    }
  }else if(typeCheck('Object')(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      cb(key,value);
    }
  }else {
    console.error(`${obj} 不是对象 无法被遍历`);
  }
}
/**
 * 类型判断函数 传递一个要判断的类型 会返回一个函数 传要判断的值 返回是否属于之前的类型
 * @param {*} type 是否是此类型
 * @returns 
 */
export function typeCheck(type) {
  let types = [
      'Array',
      'Object',
      'Number',
      'String',
      'Undefined',
      'Boolean',
      'Function',
      'Map'
  ];
  let map = {};
  types.forEach(type=>{
      map[type]  = function(target){
         return Object.prototype.toString.call(target)  == `[object ${type}]`;
      }
  })
  return map[type]
}
export function callFn(fn,...params){
    let target = fn;
	if(typeCheck('Function')(target)) target = fn(...params)
    return target
}
// 转驼峰 a-b =》 aB
export function tf(str){
  var re=/-(\w)/g;
  str=str.replace(re,function($0,$1){
    return $1.toUpperCase();
  });
  return str
};
// 数组对象去重
export function deWeight (arr,key) {
  let map = new Map();
  if (!typeCheck('Array')(arr)) {
    console.error(`${arr}不是数组`);
    return []
  }
  arr.forEach((item,index) => {
    if (!map.has(item[key])) {
      map.set(item[key], item);
    }else {
      arr.splice(index,1)
    }
  })
  return [...map.values()];
}
// 链式获取值 例如compsInstance上取值 .$parent.$options.components.page
export function getVal(obj,str,defaultVal = '') {
  let keys = str.split('.')  
  while (keys && keys.length > 0) {
    let key = keys.shift();
    if(!typeCheck('Undefined')(obj[key])){
      obj = obj[key];
    }else {
      return {
        err: true,
        errKey: key,
        result: defaultVal
      }
    }  
  }
  return {
    err: false,
    result: obj
  }
} 


let callbacks = [];
let waiting = false;
function flushCallbacks(...params) {
  callbacks = [...new Set(callbacks)]
  for (let i = 0; i < callbacks.length; i++) {
      let callback = callbacks[i];
      callback(...params);
  }
  waiting = false;
  callbacks = [];
}

export function nextTick(cb,...params) {
  if(callbacks.some(callback => callback.name === cb.name)) {
    // // console.log('重复啦');
    return
  }
  
  callbacks.push(cb); // 默认的cb 是渲染逻辑 用户的逻辑放到渲染逻辑之后即可
  if (!waiting) {
      waiting = true;
      // 1.promise先看支持不支持 
      // 2.mutationObserver
      // 3.setImmdiate
      // 4.setTimeout  Vue3 next-tick就直接用了promise
      Promise.resolve().then(()=>{
        flushCallbacks(...params)
      }); // 多次调用nextTick 只会开启一个promise
  }
}
let nextTickForImmediatelyCbSet = new Set();
let nextTickForImmediatelyTid;
export function nextTickForImmediately(fn) {
  clearTimeout(nextTickForImmediatelyTid);
  if(nextTickForImmediatelyCbSet.has(fn.name)){}
  else {
    fn();
    nextTickForImmediatelyCbSet.add(fn.name);
  }
  nextTickForImmediatelyTid = setTimeout(() => {
    nextTickForImmediatelyCbSet = new Set()
  }, 1000);
}

export function reTry(cb,props,timeout=10000) {
  let {
    errCb,
    finErrCb
  } = props
  try {
    return callFn(cb)
  } catch (error1) {
    callFn(errCb)
    setTimeout(() => {
      try {
        callFn(cb,error1)
      }
      catch (error2) {
        callFn(finErrCb,error2)
      }
    }, timeout);
  }
}

let timeId;
let timeCbs = [];
export function nextTickForSetTime(cb) {
  if(timeCbs.some(callback => callback.name === cb.name)) {
    // // console.log('重复啦');
  }else {
    timeCbs.push(cb); // 默认的cb 是渲染逻辑 用户的逻辑放到渲染逻辑之后即可
  }
  if(timeId){
    clearTimeout(timeId)
  }
  timeId = setTimeout(() => {
    for (let i = 0; i < timeCbs.length; i++) {
      let callback = timeCbs[i];
      callback();
  }
  }, 500);

}

export function getFilePath(compsInstance) {
  let filePath;
  let filePathInfo = getVal(compsInstance,`$options.__file`);
  // if(text == 'page'){
  //   return compsInstance.$options.name ? `页面对应根组件为${compsInstance.$options.name}` : '页面对应根组件未设置name'
  // }
  if(filePathInfo.err){
    filePath = '未查询到路径';
  }else {
    filePath = `${ filePathInfo.result}`
  }
  return filePath
}

export function setActive(selector,targetSelector){
  let all = document.querySelectorAll(selector)
  let target = document.querySelector(targetSelector)
  if(all && target){
    Array.from(all).forEach((item) => {
      item.classList.remove('actived')
    })
    target.classList.add('actived')
  }
}
/**
 * 复制指定内容
 * @param {*} text 
 */
export function copy(text) {
  // range.selectNode(copyContainer);
  // window.getSelection().addRange(range);
  let errMap = {
    0: `自动复制成功，路径为${text}`,
    1: '组件路径查询失败',
    2: `自动复制失败，路径为${text}`,
    3: '不支持execCommand方法，请用谷歌浏览器'
  }
  let errCode = 0;
  // if(!text.startsWith('src/')){
  //   errCode = 1
  // }
  if (!document.execCommand) errCode = 3;
    // var textarea = document.createElement("textarea");
	  // textarea.value = text;
    // document.body.appendChild(textarea);
	  // textarea.focus();
    // textarea.setSelectionRange ? textarea.setSelectionRange(0, textarea.value.length) : textarea.select();
    // var result = document.execCommand("copy");
    // document.body.removeChild(textarea);
    // if(result){

    // }else {
    //   errCode = 2
    // }
    
  let copyContainer = document.querySelector('#copytext');
  copyContainer.value = text
  copyContainer.select()
  var msg = '';
  try {
    var successful = document.execCommand('copy');
    msg = successful ? 'successful' : 'unsuccessful';
   
    console.log('Copying text command was ' + msg);
  } catch (err) {
    errCode = 2;
    msg = 'Oops, unable to copy'
    console.log('Oops, unable to copy');
  }
  // notice(errMap[errCode])
}

// 页面插入script
export function insertScript(src){
  var head= document.getElementsByTagName('head')[0];
  var script= document.createElement('script');
  script.type= 'text/javascript';
  script.src= src;
  head.appendChild(script);
}

export function compareObj(ori,target,deep) {
  let changeKeys = [];
  _compareObj(ori,target,'',deep)
  function _compareObj(ori,target,fatherKey = '',deep = 999) {
    if(deep == 0) return ;
    else deep--;
    eachObj(ori,(key,val)=>{
      let type = typeof val;
      // 前有后有
      if(target.hasOwnProperty(key)){
        // 类型不一致 key改变了
        if(typeof target[key] === type){
          // 引用类型 字符串化进行比较
          if(type == 'object'){
            if(deep) {
               _compareObj(val,target[key],key,deep)
            }else if(JSON.stringify(val) !== JSON.stringify(target[key])) {
              changeKeys.push(fatherKey+'.'+key)
            }
          }
          // 基本类型 字符串化进行比较
          else {
            
            if (val === target[key]) {
              
            }else {
              changeKeys.push(fatherKey+'.'+key)
            }
          }
        }else {
          changeKeys.push(fatherKey+'.'+key)
        }
      }else {
        console.log(`此type对应操作删除了${key}属性`);
        changeKeys.push(key)
      }
    })
  }
  return changeKeys
}

export function unique(arr) {
  if (!Array.isArray(arr)) {
      console.log('type error!')
      return
  }
  var array =[];
  for(var i = 0; i < arr.length; i++) {
          if( !array.includes( arr[i]) ) {//includes 检测数组是否有某个值
                  array.push(arr[i]);
            }
  }
  return array
}

/**
 * 一个模块中，根据type获取被改变的state
 * @param {*} type types中定义的常量值 
 * @param {*} module 模块对象
 * @returns []  action中触发的接口，一个action可能改变多个值
 */
export function getStateByType(type,module) {
  let fnStr = '';
  if(typeCheck('Function')(module.mutations[type])){
    fnStr = module.mutations[type].toString();
  }else {
    console.error(`${type}对应的不是一个函数`);
    return;
  }
  let regexp = /(?<=state.)(\w+)/g;

  return [...new Set(fnStr.match(regexp))]
}

/**
   * 根据serviceName获取接口地址
   * @param {*} service service对象
   * @param {*} serviceName service方法名
   * @returns {
 *  
 * }
 */
export function getApiByService(service,serviceName) {
    // vuexData.service.auth.apiResetPassword
    let api = `获取地址失败，请自行根据方法名查询`;
    let serviceFnStr = "";
    if(typeCheck('Function')(service[serviceName])){
      serviceFnStr = service[serviceName].toString();
      // serviceFnStr = serviceFnStr.replace(/{/g, '');
      // serviceFnStr = serviceFnStr.replace(/}/g, '');
      // 转为一行 正则默认是一行匹配，如果不是一行就会匹配失败
      serviceFnStr = serviceFnStr.replace(/\s/g, '')
      var regexpForApi = /(?<=\(['"]).*(?=\))/g; 
      let results = serviceFnStr.match(regexpForApi)
      if(typeCheck('Array')(results)){
        if(results.length > 0){
          api = results[0]
          if(api.indexOf(','>-1)){
            api = api.split(',')[0];
          }
        }
      }else {
        api =  `获取地址为空，请自行根据方法名查询`;
      }
    }else {
      // console.error(`${serviceName}对应的不是一个函数`);
      api = `对应的不是一个函数`
    }
    
    return `${serviceName} | ${api.replace('\'', '')}` 
}
/**
* 一个模块中，根据type获取action地址和其对应的api地址  
* @param {*} type types中定义的常量值 
* @param {*} module 模块对象
* @param {*} serviceByModule 模块对应的service对象
* @returns {
*  action: String action名
*  apis:  []  action中触发的接口，一个action可能触发多个接口
* }
*/
export function getActionByType(type,module, serviceByModule) {
  
  /**
   * 判断action中是否有触发此types中定义的常量值
   * @param {*} actionFnStr action方法的字符串
   * @param {*} type types中定义的常量值
   * @returns 
   */
  function isMatchActionByType(actionFnStr, type) {
      let result = {
          isMatched : false,
          serviceNames : []
      }
      // 获取api对应的方法名
      let regexpForService = /(?<=api)(\w+)/g
      // 先判断是否调用了commit 未调用则进行匹配
      if(actionFnStr.indexOf("commit(") == -1){
          // result.isMatched = false;
          // serviceNames = actionFnStr.match(regexpForService);
      }// 有调用则通过type进行一层过滤匹配
      else {
          if(actionFnStr.indexOf(type)> -1) {
              result.isMatched = true;
              let serviceNames = actionFnStr.match(regexpForService);
              if(typeCheck('Array')(serviceNames)){
                result.serviceNames = serviceNames.map(serviceName => `api${serviceName}`);
              }
          } 
      }
      return result;
  }
  let actions = [];
  eachObj(module.actions,(actionName, actionFn) => {
      let actionFnStr = '';
      if(typeCheck('Function')(actionFn)){
        actionFnStr = actionFn.toString();
      }else {
        console.error(`${actionFn}对应的不是一个函数`);
        return;
      }
      let { 
          isMatched,
          serviceNames
      } = isMatchActionByType(actionFnStr, type);
      if(isMatched){
          let apis;
          if (typeCheck('Array')(serviceNames) && serviceNames.length> 0) {
            apis = serviceNames.map(serviceName => getApiByService(serviceByModule,serviceName));
          }else {
            apis = ['未调用接口'];
          }
          actions.push({
              action: actionName,
              // 根据serviceName 获取接口地址
              apis
          });
      }
  })
  return actions;
}

