import { callFn, deWeight, eachObj, getVal, nextTick, nextTickForImmediately, nextTickForSetTime, reTry, setActive, tf, typeCheck } from "../../util";


let getMappWinodow; // 用户传来的配置项


let mappSId = ''
// 获取组件的key
function getCompName(comp) {
  let {err,result} = getVal(comp,'$options._componentTag');
  let compName;
  if(err){
    // // console.log('获取失败',rootCompInstance,comp);
      // compName = '获取失败'
      let {err: compNameErr, result : compNameResult} = getVal(comp,'$el.classList.0');
      if (!compNameErr) {
        compName = compNameResult;
      }
  }else {
      compName = result;
  }
  if(typeCheck('Undefined')(compName)){
    compName = `getNameFailForComp${comp._uid}`;
  }
  // -转驼峰
  compName = tf(compName);
  return compName
}
// 判断组件是否需要处理
// 目前涉及的范围 1. mounted实现v-if重置  2. 组件收集时
function noNeedResolveComp(comp){
  let noNeedResolve = false; // 默认需要处理
  let compName = getCompName(comp);
  let ignoreComps = []; // 需忽略的组件
  ignoreComps.push(...data.ignoreComps);
  let ignoreCompsPrefix = ['getNameFail']; // 需忽略的组件前缀
  ignoreCompsPrefix.push(...data.ignoreCompsPrefix)
  if(ignoreComps.some(comp => comp === compName)) noNeedResolve = true
  if(ignoreCompsPrefix.some(comp => compName.startsWith(comp))) noNeedResolve = true

  // 如果是tab组件 则不处理
  // if(compName.startsWith('tab')){
  //   noNeedResolve = true
  // }
  // 如果文件路径是packages说明是第三方包 则不处理
  if(getVal(comp,'$options.__file').result.startsWith('packages/')) noNeedResolve = true
  // if(data.isDev || getVal(comp,'$options.__file').result.startsWith('src/')){
   
  // }else {
  //  noNeedResolve = true
  // }

  return noNeedResolve
}
export let data = {
  firstInited: false, // 初次渲染已完成
  isMapp: false,// 是否是微应用
  _getMappWinodow: ()=>{},
  h: ()=>{ console.log('未获取h函数');},
  errMsg: '组件列表为空，糟糕，大概出啥子问题了，快去提issue吧~', // 错误提示信息
  mappChannelInstance: false, // 微应用控制面板实例
  showPhanel: false,// 控制是否显示面板
  notFirstRenderChooseBtn: false,
  routeVmList : [],// 当前匹配到的路由列表，存储对象为PageVmHandler的实例
  currentRouteIndex : -1,// 当前页面组件索引
  _currentVmkey: '', // 当前$vm指向 由当前路由
  currentPageVm: {},// 当前页面组件，即$vm指向的vue实例
  // 遇到了一些会因为设置mask导致页面出错的组件 可以采用这个进行设置vm，传入索引，返回值是其filePath
  /**
   * 
   * @param {*} value 匹配索引 可以是索引 也可以是对象key
   * @param {*} isKey 是否是对象key模式
   * @returns 
   */
  setVm(value = 0, isKey = false){
    let currentVueInstanceKey;
    if(isKey){
      currentVueInstanceKey =  _data.currentVmMap[value]
    }else {
      currentVueInstanceKey =  Array.from(_data.currentVmMap)[index][0]
    }
    data.currentVueInstanceKey = currentVueInstanceKey;
    return Array.from(_data.currentVmMap)[index][1].$options.__file
  },
  setRouteVm(index = 0, type){
    data.currentRouteIndex = index;
    data._currentRouteKey = data.routeVmList[index].key;
    return data.setVm(0);
  },
  setDegger(name){
    // $vm[name] = new Proxy($vm[name], {
    //   get(target, key) {
    //     console.log('获取了getter属性');
    //     return target[key];
    //   }
    // })
    let changes = [];
    _data.changeKey = changes;
    $vm.$watch(name,(newVal,oldVal)=>{
      changes.push({
        newVal,
        oldVal
      })
      
      console.log('新值：' + JSON.stringify(newVal),
      '老值：' + JSON.stringify(oldVal))
      // console.log(arguments.callee.caller.name);
      // console.log((new Error()).stack.split("\n")[2].trim().split(" ")[1]);
      // console.log((new Error()).stack);
    })
  },
  isDev: /qa.*test/.test(location.host),
  opts: {},// 用户传来的配置项
  pluginKey : 'vm',
}
Object.defineProperty(data, 'customClass', {
  get(){
    return data.pluginKey + '-msgbox'
  }
})
window._data = data;
if(window.vmDebugPlugin){
  vmDebugPlugin._data = data;
}
// $vm指向的key
Object.defineProperty(data,'currentVueInstanceKey',{
  get(){
    // 初始化时进行默认设置值
    return data._currentVmkey.split('--')[1] || ''
  },
  // 根据key设置当前路由组件索引，即切换当前路由组件
  set(newVal){
    let key = `${data.currentRouteKey}--${newVal}`;
    if(data._currentVmkey !== key){
      data._currentVmkey = key;
      // 如果没有进行设置$vm 则切换路由不能影响当前属性 在关闭弹窗时需要设置currentRouteKey 为 _currentRouteKey
      data._currentRouteKey = data.currentRouteKey;
      data.currentPageVm = window.$vm = data.currentVmMap.get(newVal);
      // 第一次的时候，因为dom还没有渲染出来，所以不会生效 但在渲染时已经进行了判断 所以高亮还是会存在
      setActive('.vm-link',`#${key}`)
    }else {

    }
     
  }
})
// 获取当前路由组件ids
Object.defineProperty(data,'currentIds',{
  get(){
    return data.currentRouteHander.ids || []
  }
})

// 获取当前路由对应的收集中心
Object.defineProperty(data,'currentVmMap',{
  get(){
    return data.currentRouteHander.vmMap || new Map()
  }
})
// 当前路由处理者
Object.defineProperty(data,'currentRouteHander',{
  get(){
    return data.routeVmList[data.currentRouteIndex] || {}
  }
})
// 当前的路由key 路由改变同步更新 当前page实例：currentPageVm 当前page索引 currentPageVmIndex 当前$vm指向 currentVueInstanceKey
Object.defineProperty(data,'currentRouteKey',{
  get(){
      return data.currentRouteHander.key
  },
  // 组件中是根据key进行绑定的，所以需要key的变化设置当前路由组件索引，即切换当前路由组件
  set(key){
    data.routeVmList.forEach(item=>{
      if(item.match('key',key)){
        data.currentRouteIndex = item.index
      }
    })
  }
})



export function getVmByKey(key,routeKey = data.currentRouteKey) {
  return data.routeVmList.filter(route=>route.match('key',routeKey))[0].vmMap.get(key)
}

/**
 * 核心类
 * key 路由文件名，也会用于展示在tabs的选项卡上
 * pageVm 页面vue组件实例
 * index 在data.routeVmList中的索引，也代表是第几级路由
 */
class PageVmHandler {
  constructor(key,pageVm,index){
    // 重置当前PageVmHandler
    this.reset = () => {
      this.ids = [] // 对应的所有已挂载组件的组件id
      this.pageVm = pageVm; // 页面组件
      this.pageVmId = pageVm._uid; // 页面组件id
      this.key = key; // 路由key
      this.index = index; // 几级路由 从0开始
      this.vmMap = new Map(); // 对应的收集中心
    }
    this.reset()
  }
  /**
   * 先重置当前PageVmHandler
   * 进行后代组件的注册
   * @param {*} cutId 下一级路由实例的id 当匹配到这个id时则停止组件收集
   */
  init(cutId) {
    this.reset()
    this.registerComp(cutId)
  }
  // 收集后代组件，存于收集中心vmMap
  registerComp(cutId) {
    let vmMap = this.vmMap;
    let ids = this.ids;
    /**
      * 在window上持有当前的vm实例从而方便调试 $vm 默认指向当前页面
      * @param {*} vmKey 唯一key
    */  
    function setVmInstance (vmKey = '') {
      if(!vmKey) console.error('_registerComp注册时传递必须key')
      else {
        if (!vmMap.has(vmKey)) {
          vmMap.set(vmKey , this);
        }else {
          // 存在使用多个组件的情况 保存方便更改指向找到需要的实例对象
          if(!typeCheck('Array')(vmMap.get(vmKey).vms )){
            vmMap.get(vmKey).vms = []
            vmMap.get(vmKey).setVm1 = function setVm1(index) {
              window.$vm1 = this.vms[index]
            }
          }
          vmMap.get(vmKey).vms.push(this);
        }
      }
    }
    function _registerComp(rootCompInstance,rootCompName,root = true){
      if(root){
        setVmInstance.call(rootCompInstance,rootCompName)
        ids.push(rootCompInstance._uid);
      }
      let compsInstance = rootCompInstance.$children;
      compsInstance.forEach(comp => {
          let compName;
          // -转驼峰
          compName = getCompName(comp);
          // 递归加载 组件中的内容  w-todo 待添加引用关系 父子孙组件
          let filePathInfo = getVal(comp,`$options.__file`);
          // 如果找不到__file 说明是全局UI组件 忽略掉  w-todo 测试环境都找不到文件路径 所以先放开 后期待优化
          // if(filePathInfo.err){ 
          //   // if(comp.initList){
          //     _registerComp(comp,compName)
          //   // }
          // } 
          // // 如果不是src中引入的文件，说明也不是本地组件
          // else if(filePathInfo.result.startsWith('src/')) {
          //   _registerComp(comp,compName)
          // }else if(typeCheck('Array')(comp.$children)) {
          //   _registerComp(comp,compName,false)
          // }
          // 下一级路由实例的id 当匹配到这个id时则停止组件收集
          if(comp._uid !== cutId)
          {
            // if (compName === 'weFastClinic') {
            //   debugger
            // }
            // 如果不需要处理的组件则不收集
            if(noNeedResolveComp(comp)){
              _registerComp(comp,compName,false)
            }else {
              _registerComp(comp,compName)
            }
          }
          
      })
    }
    _registerComp(this.pageVm,'page')
  }
  /**
   * 查看是否匹配
   * @param {*} type 对比的key是什么  ： index key
   * @param {*} val  对比值
   * @returns 
   */
  match(type,val){
    return this[type] === val
  }
}

// 清空插件 考虑都要支持多级路由 调用所有的PageVmHandler的重置方法
export function emitResetVmDebuPlugin(to){
  function resetVmDebuPlugin(to) {
    // console.log('重置：发布');
    // 重置考虑三种情况： 1. 祖孙路由跳转 2. 兄弟路由跳转 3. 无关路由跳转
    let flag = true;
    let index = 0;// 记录到哪开始不匹配了
    while (flag) {
      if(data.routeVmList[index] && to.matched[index]){
        if(data.routeVmList[index].match('pageVmId',getVal(to.matched[index].instances,'default._uid').result)){
          index++;
        }else {
          flag = false;
        }
      }else {
        flag = false;
      }
      
    }
    data.routeVmList.splice(index)
    data.currentRouteIndex = data.routeVmList.length-1
    data._currentRouteKey = data.currentRouteKey;
  }
  nextTick(resetVmDebuPlugin,to)
}
let initCbs = [];
function addInitCbs(fn) {
  if(typeCheck('Function')(fn) && initCbs.every(cb => cb.name !== fn.name)) initCbs.push(fn);
}
// 触发初始化插件逻辑 根据所有页面组件进行收集中心初始化
export function emitInitVmDebuPlugin(cb){
    addInitCbs(cb)
     // console.log('开始注册逻辑 订阅');
    // 根据页面组件获取其对应的收集中心 （考虑都要支持多级路由 此处为将所有PageVmHandler进行收集中心的初始化）
    function initVmDebuPlugin(){
       /**
        * 收集每级路由对应页面收集中心 
        * 在子跳父级别页面跳转时，不会触发beforeRouteEnter钩子，这也意味着初始化插件逻辑不会被执行，所以我们需要在beforeRouteLeave中一个类似domdiff的处理
        *     1. 判断将要去的路由和当前路由匹配的组件有多少是相同的，如果没有，说明是无关页面跳转，之前逻辑ok
        *     2. 如果当前路由全包裹去路由，说明是子跳父，beforeRouteEnter钩子不执行，所以我们要利用beforeRouteLeave钩子splice当前的组件列表，保留重复项
        *     3. 如果是去路由全包裹当前路由，说明是父跳子，复用splice的数组，然后在进行去重即可
        *     4. 如果局部相同，说明是兄弟跳转，看匹配到哪个组件没有uid，即停止比对（因为兄弟跳转代表有组件是未挂载状态）
        * */
      if(getVal(data,'currentPageVm.$route.matched').err) return
      
      let newRouteVmList = data.currentPageVm.$route.matched.slice(data.routeVmList.length).map((match,index) =>{
        let pageVm = {}; // 页面组件实例
        let routeName = ""; // 路由名称
        let pageVmInfo = getVal(match,'instances.default')
        // 获取页面组件
        if (!pageVmInfo.err) {
          pageVm = pageVmInfo.result;
          // 在new时会进行注册 所以假设存在v-if的问题，也会在此被重置掉
        }else {
          // console.log('路由组件实例获取失败，失败key：'+ routeNameInfo.errKey);
        }
        // 获取路由名称
        let routeNameInfo = getVal(match,'components.default.__file')
        if(!routeNameInfo.err){
          let filePath = routeNameInfo.result;
          routeName = filePath.split('/').pop().split('.')[0]
        }else {
          // /aaa/edit/:id => eidt/Qid 因为后面需要操作dom 而/、:、Y不是合法的选择器
          try {
            let i = 0;
            let names = match.path.replace('/','').split('/').map(item => {
              if(item.indexOf(':') !== -1){
                return 'Q' + match.regex.keys[i++].name
              }else {
                return item
              }
            })
            if(names.length > 3) {
              names = names.splice(names.length-3)
            }
            routeName = names.join('_')
          } catch (error) {
            routeName = 'getNameFailForRoute' + pageVm._uid || index
            console.log('debugplugin-路由名称获取失败',error);
          }
        }
        if(routeName && pageVm._uid){
          return new PageVmHandler(routeName,pageVm,index)  
        }else {
          return false
        }
      }).filter(item=>{
        if (item === false) {
          return false
        }
        return data.routeVmList.every(nowItem=>{
          return nowItem.pageVmId !== item.pageVmId
        })
      })
      data.routeVmList.push(...newRouteVmList)
      // 数组去重 避免微应用中出现路由对象存在重复的情况 /order 原因待定
      deWeight( data.routeVmList,'key')
      data.routeVmList.forEach((routeVm,index) => {
       let cutId = 0;
       if(index < data.routeVmList.length - 1){
          cutId = data.routeVmList[index+1].pageVmId; // 下一级路由实例的id 当匹配到这个id时则停止组件收集
       }
       routeVm.init(cutId)
      })
      initCbs.forEach(cb => callFn(cb))
      initCbs = [];
    }
    // console.log('开始注册逻辑 发布')
    if(data.isMapp){
      clearTimeout(mappSId)
      mappSId = setTimeout(() => {
        // 待梳理支持子应用 resolved 如果用户传递的【是否属于子应用】函数匹配成功并返回了当前页面组件实例，则交由子应用接管
        // q: 待梳理 如何支持微应用控制面板的判断 从而接入微应用
        // a: 用户传递一个获取子应用全局变量的函数，会在执行时传递当前的匹配到的路径，此函数中应判断如果符合子应用逻辑，则将vmMap交由子应用进行托管
        // try {
         
        // } catch (error) {
        //   console.log('获取子应用的函数错误，默认会进行一次延时重传：',error);
        //   setTimeout(() => {
        //     let mappWindow = callFn( data._getMappWinodow,data.mappChannelInstance);
        //     let mappCurrentPageVm = mappWindow ? mappWindow.$vm : {};
        //     if(mappCurrentPageVm && mappCurrentPageVm._uid){
        //       data.currentPageVm = mappCurrentPageVm;
        //       // data.mappChannelInstance = false; // 将其置空 避免多次进入微应用注册逻辑
        //       console.log('微应用控制面板接入成功');
        //       // 避免重复调用
        //       nextTickForSetTime(initVmDebuPlugin)
        //     }
        //   }, 1000);
        // }
        reTry(() => {
          let mappWindow = callFn( data._getMappWinodow,data.mappChannelInstance);
          let mappCurrentPageVm = mappWindow ? mappWindow.$vm : {};
          if(mappCurrentPageVm && mappCurrentPageVm._uid){
            data.currentPageVm = mappCurrentPageVm;
            // data.mappChannelInstance = false; // 将其置空 避免多次进入微应用注册逻辑
            console.log('微应用控制面板接入成功');
             // 避免重复调用
            nextTickForSetTime(initVmDebuPlugin)
            clearTimeout(mappSId)
          }else {
            throw mappWindow
          }
        },{
          errCb: (error) => {
            console.log('获取子应用的函数错误，默认会进行一次延时重传：',typeCheck('Object')(error) ? JSON.stringify(error) : error);
          },
          finErrCb: (error)=> {
            console.log('获取子应用的函数错误',typeCheck('Object')(error) ? JSON.stringify(error) : error);
          }
        })
        
      }, 10000);
    }else {
      // 避免从微应用页面过来时还执行了这个定时器
      clearTimeout(mappSId)
      // 避免重复调用
      nextTickForSetTime(initVmDebuPlugin)
    }

}


// 装载插件 入口函数 main
function importPlugin(Vue,options){  
  data.opts = options;
  eachObj(data.opts, (key, val) => {
    Object.defineProperty(data, key, {
      get(){
        return data.opts[key]
      },
      set(newVal){
        data.opts[key] = newVal;
      }
    })
  })
  setDeFaultVal(data.opts)
  function setDeFaultVal(obj){
    let defaultMap = {
      getMappWinodow(){},
      ignoreComps: [],
      ignoreCompsPrefix: [],
      msgboxWidth: 800,
      msgboxHeight: 500,
      filterDepends: false
    }
    eachObj(defaultMap, (key, val) => {
      if(typeof obj[key] !== typeof defaultMap[key]){
        obj[key] = defaultMap[key]
      }
    })
  }
  let {
    getMappWinodow, // 获取子应用全局变量的函数 如果无返回值正常渲染即可
    mappPanelKey // 定义在微应用的主应用中控制面板d_name的值
  } = options;
  let vmDebugPluginMixin = {
    beforeRouteEnter (to, from, next) {
      next(function (vm) {
        if(vm._uid) data.h = vm.$createElement
        // 包裹一层 从而只执行一遍
        nextTickForImmediately(
          function initRoute() {
            // console.log(vm,'====beforeRouteEnter',to);
            if (getMappWinodow(to.fullPath)) {
              data._getMappWinodow = getMappWinodow(to.fullPath);
              data.isMapp = true;
            }else {
              data.isMapp = false;
              data._getMappWinodow = () => {}
            }
            // 如果是微应用
            if (data.isMapp) {
              data.errMsg = '当前页面是微应用，需要延时加载，请十秒后使用'
            }else {
              data.mappChannelInstance = false;
              data.errMsg = '组件列表为空，糟糕，大概出啥子问题了，快去提issue吧'
            }
            // 收集每级路由对应页面收集中心
            // data.routeVmList.push(new PageVmHandler(routeName,vm,data.routeVmList.length));
            // 默认最后一个被路由匹配上为当前页面组件
            data.currentPageVm = to.matched[to.matched.length-1].instances.default
            data.currentRouteIndex = to.matched.length-1;
          }
        )
        
        emitInitVmDebuPlugin(function initRouteVm(params) {
            // 默认最内层匹配页面路由为展示路由 且 $vm默认指向当前页面组件实例
            data.currentRouteIndex = data.routeVmList.length -1;
            // 持有最初的路由key 用以实现关闭弹窗时还原数据的功能
            data._currentRouteKey = data.currentRouteKey;
            // data._currentVmkey = data.currentRouteKey+'--page';
            data.currentVueInstanceKey = 'page';
            data.firstInited = true;
        }); 
      });
    },
    beforeRouteLeave(to, from, next){
      // console.log('重置：订阅');
      // data.mappChannelInstance = false; // 离开路由时置空
      emitResetVmDebuPlugin(to)
      clearTimeout(mappSId)
      next()
    },
    beforeDestroy(){
      // 考虑到v-if的情况，在组件卸载时去掉在ids中的记录
      let ids = data.currentIds;
      ids.splice(ids.indexOf(this._uid),1)
    },
    mounted(){
      
      // 分两种情况：
      // 1.  第一次页面初始化 ：在最外层页面组件的mounted才进行插件的初始化，这样就可以避免重复注册的性能浪费
      // 2.  v-if导致页面中组件的装载卸载 ：如果其组件的父组件在当前收集中心中，就根据当前页面实例重置收集中心列表（w-todo：待优化比对过程）
      //      2.1 假设多个组件挂载, 就会触发多次重置, 此处借助nextTick实现原理,进行一层优化,采用微任务进行注册，且使用防抖
      // let pageVm = vmMap.get('page');
      // if( this.$parent && ids.indexOf(this.$parent._uid) !== -1){
      //   emitInitVmDebuPlugin()
      //   // // console.log('开始注册逻辑 订阅',this.$options.name);
      // }
      // w-todo 测试环境组件会没有__file 属性 暂不知道原因 所以先去掉这个判断
      // debugger
      if(this.$options.d_name=== mappPanelKey){
        data.mappChannelInstance = this;
      }
      if( !noNeedResolveComp(this) && ( data.firstInited) && !data.isMapp){
      //   // 定义在微应用的主应用中控制面板d_name的值 如果相同 说明是控制面板实例 保存用于主应用获取子应用的包裹全局对象
      //   if(this.$options.d_name=== mappPanelKey){
      //     data.mappChannelInstance = this;
      //   }
        emitInitVmDebuPlugin()
      //   // console.log('开始注册逻辑 订阅',this.$options.name);
      }
      // if(currentPageVm && currentPageVm._uid == this._uid){
      //   emitInitVmDebuPlugin()
      //   // // console.log('开始注册逻辑 订阅',this.$options.name);
      // }
    }
  }
  Vue.mixin(vmDebugPluginMixin)
}

export default importPlugin