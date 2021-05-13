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
  }else {
    for (const [key, value] of Object.entries(obj)) {
      cb(key,value);
    }
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
    filePath = `对应文件路径为${ filePathInfo.result}`
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