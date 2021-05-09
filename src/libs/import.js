import { callFn, getVal, nextTick, tf } from "../../util";

let getMappWinodow; // 用户传来的配置项

export let currentPageVmIndex = -1; // 当前页面组件索引
export let currentPageVm = {}; // 当前页面组件索引

export let routeVmList = []; // 当前匹配到的路由列表，存储对象为PageVmHandler的实例
// 以下是一些暴露给其他模块用以获取信息的接口
// 获取当前的收集中心
export function getCurrentVmMap() {
  if (routeVmList[currentPageVmIndex] && routeVmList[currentPageVmIndex].vmMap) {
    return routeVmList[currentPageVmIndex].vmMap
  }else {
    return new Map()
  }
}
// 获取当前的收集中心
export function getCurrentVmKey() {
  if (routeVmList[currentPageVmIndex] && routeVmList[currentPageVmIndex].key) {
    return routeVmList[currentPageVmIndex].key
  }else {
    return ''
  }
}
// 根据key设置当前路由组件索引，即切换当前路由组件
export function setCurrentPageVmIndexByKey(key) {
  let currentPageVm = routeVmList.filter(routeVm => {
    return routeVm.match('key',key)
  })[0]
  currentPageVmIndex = currentPageVm.index
}
// 获取当前路由组件ids
export function getCurrentIds() {
  if (routeVmList[currentPageVmIndex] && routeVmList[currentPageVmIndex].ids) {
    return routeVmList[currentPageVmIndex].ids
  }else {
    return []
  }
}

/**
 * 核心类
 * key 路由文件名，也会用于展示在tabs的选项卡上
 * pageVm 页面vue组件实例
 * index 在routeVmList中的索引，也代表是第几级路由
 */
class PageVmHandler {
  constructor(key,pageVm,index){
    // 重置当前PageVmHandler
    this.reset = () => {
      this.ids = [] // 对应的所有已挂载组件的组件id
      this.pageVm = pageVm; // 页面组件
      this.key = key; // 路由key
      this.index = index; // 几级路由 从0开始
      this.vmMap = new Map(); // 对应的收集中心
    }
    this.reset()
  }
  /**
   * 先重置当前PageVmHandler
   * 再看是否匹配上了微前端
   * 未匹配上时，进行后代组件的注册
   * @param {*} to 
   */
  init(to = window.location.href) {
    this.reset()
    this.registerComp()
  }
  // 收集后代组件，存于收集中心vmMap
  registerComp() {
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
        }
      }
    }
    function _registerComp(rootCompInstance,rootCompName){
      setVmInstance.call(rootCompInstance,rootCompName)
      ids.push(rootCompInstance._uid);
      let compsInstance = rootCompInstance.$children;
      compsInstance.forEach(comp => {
          let {err,result} = getVal(comp,'$options._componentTag');
          let compName;
          if(err){
            // console.log('获取失败',rootCompInstance,comp);
              // compName = '获取失败'
          }else {
              compName = tf(result);
              // 递归加载 组件中的内容  w-todo 待添加引用关系 父子孙组件
              let filePathInfo = getVal(comp,`$options.__file`);
              // 如果找不到__file 说明是全局UI组件 忽略掉
              if(filePathInfo.err){ 

              }else {
                _registerComp(comp,compName)
              }
          }
          
      })
    }
    _registerComp(this.pageVm,'page')
  }
  // 内部方法，用于切换查看的组件时使用，外界会调用向外暴露的setVm ，然后通过其调用当前页面的setVm
  setVm(vmKey = 'page') {
    window.$vm = this.vmMap.get(vmKey);
  };
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
// 找到当前调试的路由页面组件 然后再进行切换
export function setVm(key) {
  routeVmList[currentPageVmIndex].setVm(key)
}
// 清空插件 考虑都要支持多级路由 调用所有的PageVmHandler的重置方法
export function resetVmDebuPlugin() {
  routeVmList = []
}
// 触发初始化插件逻辑 根据所有页面组件进行收集中心初始化
export function emitInitVmDebuPlugin(){
    // 根据页面组件获取其对应的收集中心 （考虑都要支持多级路由 此处为将所有PageVmHandler进行收集中心的初始化）
    function initVmDebuPlugin(){
      console.log('开始注册逻辑 发布')
      try {
          // 待梳理支持子应用 resolved 如果用户传递的【是否属于子应用】函数匹配成功并返回了当前页面组件实例，则交由子应用接管
          // q: 待梳理 如何支持微应用控制面板的判断 从而接入微应用 
          // a: 用户传递一个获取子应用全局变量的函数，会在执行时传递当前的匹配到的路径，此函数中应判断如果符合子应用逻辑，则将vmMap交由子应用进行托管
          let mappCurrentPageVm = callFn(getMappWinodow,window.location.href,currentPageVm);
          if(mappCurrentPageVm && mappCurrentPageVm._uid){
            currentPageVm = mappCurrentPageVm
          }
      } catch (error) {
          console.log('获取子应用的函数错误：',error);
      }
       // 收集每级路由对应页面收集中心
      routeVmList = currentPageVm.$route.matched.map((match,index) =>{
        let filePathInfo = getVal(match,'components.default.__file')
        if(!filePathInfo.err){
          let filePath = filePathInfo.result;
          let routeName = filePath.split('/').pop().split('.')[0]
          let pageVmInfo = getVal(match,'instances.default')
          if (!pageVmInfo.err) {
            let pageVm = pageVmInfo.result;
            return new PageVmHandler(routeName,pageVm,index)
          }else {
            console.log('路由组件实例获取失败，失败key：'+ filePathInfo.errKey);
          }
        }else {
          console.log('路由组件__file获取失败，失败key：'+ filePathInfo.errKey);
        }
        return {
          init(){
            console.log('初始化失败：'+ match);
          }
        }
      })
      routeVmList.forEach((routeVm,index) => {
        routeVm.init()
         // 默认最内层匹配页面路由为展示路由 且 $vm默认指向当前页面组件实例
        if (index == routeVmList.length -1) {
          currentPageVmIndex = routeVmList.length - 1;
          routeVm.setVm()
        }
      })
    }
    // 避免重复调用
    nextTick(initVmDebuPlugin)
}

function importPlugin(Vue,_getMappWinodow){    
  let vmDebugPluginMixin = {
    beforeRouteEnter (to, from, next) {
      next(vm => {
        // 收集每级路由对应页面收集中心
        // routeVmList.push(new PageVmHandler(routeName,vm,routeVmList.length));
        // 默认最后一个被路由匹配上为当前页面组件
        currentPageVm = vm;
        // initVmMap(vm,to);
      })
    },
    beforeRouteLeave(to, from, next){
      resetVmDebuPlugin()
      next()
    },
    beforeDestroy(){
      // 考虑到v-if的情况，在组件卸载时去掉在ids中的记录
      let ids = getCurrentIds()
      ids.splice(ids.indexOf(this._uid),1)
    },
    mounted(){
      
      // 分两种情况：
      // 1.  第一次页面初始化 ：在最外层页面组件的mounted才进行插件的初始化，这样就可以避免重复注册的性能浪费
      // 2.  v-if导致页面中组件的装载卸载 ：如果其组件的父组件在当前收集中心中，就根据当前页面实例重置收集中心列表（w-todo：待优化比对过程）
      //      2.1 假设多个组件挂载, 就会触发多次重置, 此处借助nextTick实现原理,进行一层优化,采用微任务进行注册，且使用防抖
      // let pageVm = vmMap.get('page');
      let ids = getCurrentIds()
      if( this.$parent && ids.indexOf(this.$parent._uid) !== -1){
        emitInitVmDebuPlugin()
        console.log('开始注册逻辑 订阅',this.$options.name);
      }
      if(currentPageVm && currentPageVm._uid == this._uid){
        emitInitVmDebuPlugin()
        console.log('开始注册逻辑 订阅',this.$options.name);
      }
    }
  }
  Vue.mixin(vmDebugPluginMixin)
  getMappWinodow = _getMappWinodow
}

export default importPlugin