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
  export function getVal(obj,str) {
    
    let keys = str.split('.')  
    while (keys && keys.length > 0) {
      let key = keys.shift();
      if(obj[key]){
        obj = obj[key];
      }else {
        return {
          err: true,
          errKey: key
        }
      }  
    }
    return {
      err: false,
      result: obj
    }
  } 
  
  let callbacks = [];
  let waiting;
  function flushCallbacks(...params) {
    for (let i = 0; i < callbacks.length; i++) {
        let callback = callbacks[i];
        callback(...params);
    }
    waiting = false;
    callbacks = [];
  }
  // 批处理 第一次开定时器 ，后续只更新列表 ，之后执行清空逻辑
  
  // 1.第一次cb渲染watcher更新操作  （渲染watcher执行的过程肯定是同步的）
  // 2.第二次cb 用户传入的回调
  export function nextTick(cb,...params) {
    callbacks.push(cb); // 默认的cb 是渲染逻辑 用户的逻辑放到渲染逻辑之后即可
    if (waiting) {
      clearTimeout(waiting)
        // 1.promise先看支持不支持 
        // 2.mutationObserver
        // 3.setImmdiate
        // 4.setTimeout  Vue3 next-tick就直接用了promise
        // Promise.resolve().then(()=>{
        //   flushCallbacks(...params)
        // }); // 多次调用nextTick 只会开启一个promise 
    }
    waiting = setTimeout(() => {
      flushCallbacks(...params)
    }, 3000);
  }





  headCompList = routeVmList.map(route=>{
    let {key,val} = route;
    return {
        props: {
        label: key,
        span: 12,
        key: key
        },
        style: {
        textAlign: 'center'
        },
        events: {
        click(){
            currentPageVm = val;
            emitInitVmDebuPlugin();
            // renderChoosePhanel()
            // notice(`设置成功，当前$vm指向: ${ key }`)
        }
        },
        text: key
    }
    })
    // let head = generateRadioGroup(routeVmList,data,'currentRoute')
    let head = generateRowComponent(h,{
        children: headCompList,
        props: {
            gutter: 20
        }
    })





    // function generateRadioGroup(list,target,targetKey) {
    //   function _generateButton(opt) {
    //     let {key,val} = opt;
    //     return h('el-radio-button',{
    //       key: key,
    //       label: key,
    //       on: {
    //         change(){
    //           debugger
    //           target[targetKey] = val
    //         },
    //         input(){
    //           debugger
    //           target[targetKey] = val
    //         }
    //       }
    //     },[key])
    //   }
    //  return h('el-radio-group',{
    //     size:"small",
    //     value: target[targetKey],
    //     on: {
    //       change(item){
    //         console.log(item);

    //       }
    //     }
    //   },list.map(item=>_generateButton(item)))
    // }