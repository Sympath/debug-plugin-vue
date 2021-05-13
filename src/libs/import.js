import { callFn, eachObj, getVal, nextTick, nextTickForSetTime, setActive, tf } from "../../util";

let getMappWinodow; // 用户传来的配置项



export let data = {
  showPhanel: false,// 控制是否显示面板
  notFirstRenderChooseBtn: false,
  routeVmList : [],// 当前匹配到的路由列表，存储对象为PageVmHandler的实例
  currentRouteIndex : -1,// 当前页面组件索引
  _currentVmkey: '', // 当前$vm指向 由当前路由
  currentPageVm: {},// 当前页面组件，即$vm指向的vue实例
  // 遇到了一些会因为设置mask导致页面出错的组件 可以采用这个进行设置vm，传入索引，返回值是其filePath
  setVm(index = 0){
    data.currentVueInstanceKey =  Array.from(_data.currentVmMap)[index][0]
    return Array.from(_data.currentVmMap)[index][1].$options.__file
  }
}
window._data = data;

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
    data.currentRouteIndex = data.routeVmList.filter(item=>item.match('key',key))[0].index
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
            // // console.log('获取失败',rootCompInstance,comp);
              // compName = '获取失败'
          }else {
              compName = tf(result);
              // 递归加载 组件中的内容  w-todo 待添加引用关系 父子孙组件
              let filePathInfo = getVal(comp,`$options.__file`);
              // 如果找不到__file 说明是全局UI组件 忽略掉
              if(filePathInfo.err){ 

              } 
              // 如果不是src中引入的文件，说明也不是本地组件
              else if(filePathInfo.result.startsWith('src/')) {
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
// 触发初始化插件逻辑 根据所有页面组件进行收集中心初始化
export function emitInitVmDebuPlugin(){
     // console.log('开始注册逻辑 订阅');
    // 根据页面组件获取其对应的收集中心 （考虑都要支持多级路由 此处为将所有PageVmHandler进行收集中心的初始化）
    function initVmDebuPlugin(){
      // console.log('开始注册逻辑 发布')
      try {
          // 待梳理支持子应用 resolved 如果用户传递的【是否属于子应用】函数匹配成功并返回了当前页面组件实例，则交由子应用接管
          // q: 待梳理 如何支持微应用控制面板的判断 从而接入微应用 
          // a: 用户传递一个获取子应用全局变量的函数，会在执行时传递当前的匹配到的路径，此函数中应判断如果符合子应用逻辑，则将vmMap交由子应用进行托管
          let mappCurrentPageVm = callFn(getMappWinodow,window.location.href,data.currentPageVm);
          if(mappCurrentPageVm && mappCurrentPageVm._uid){
            currentPageVm = mappCurrentPageVm
          }
      } catch (error) {
          // console.log('获取子应用的函数错误：',error);
      }
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
        let filePathInfo = getVal(match,'components.default.__file')
        if(!filePathInfo.err){
          let filePath = filePathInfo.result;
          let routeName = filePath.split('/').pop().split('.')[0]
          let pageVmInfo = getVal(match,'instances.default')
          if (!pageVmInfo.err) {
            let pageVm = pageVmInfo.result;
            // 在new时会进行注册 所以假设存在v-if的问题，也会在此被重置掉
            return new PageVmHandler(routeName,pageVm,index)
          }else {
            // console.log('路由组件实例获取失败，失败key：'+ filePathInfo.errKey);
          }
        }else {
          // console.log('路由组件__file获取失败，失败key：'+ filePathInfo.errKey);
        }
        return {
          init(){
            // console.log('初始化失败：'+ match);
          }
        }
      }).filter(item=>{
        return data.routeVmList.every(nowItem=>{
          return nowItem.pageVmId !== item.pageVmId
        })
      })
      data.routeVmList.push(...newRouteVmList)
      data.routeVmList.forEach((routeVm,index) => {
        routeVm.init()
      })
      // 默认最内层匹配页面路由为展示路由 且 $vm默认指向当前页面组件实例
      data.currentRouteIndex = data.routeVmList.length -1;
      // 持有最初的路由key 用以实现关闭弹窗时还原数据的功能
      data._currentRouteKey = data.currentRouteKey;
      // data._currentVmkey = data.currentRouteKey+'--page';
      data.currentVueInstanceKey = 'page'
    }
    // 避免重复调用
    nextTickForSetTime(initVmDebuPlugin)
}

// 装载插件 入口函数 main
function importPlugin(Vue,_getMappWinodow){  
 
  let vmDebugPluginMixin = {
    beforeRouteEnter (to, from, next) {
      next(function (vm) {
        // 收集每级路由对应页面收集中心
        // data.routeVmList.push(new PageVmHandler(routeName,vm,data.routeVmList.length));
        // 默认最后一个被路由匹配上为当前页面组件

        data.currentPageVm = to.matched[to.matched.length-1].instances.default
        data.currentRouteIndex = to.matched.length-1;
        emitInitVmDebuPlugin(); 
      });
    },
    beforeRouteLeave(to, from, next){
      // console.log('重置：订阅');
      emitResetVmDebuPlugin(to)
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
      let ids = data.currentIds
      // if( this.$parent && ids.indexOf(this.$parent._uid) !== -1){
      //   emitInitVmDebuPlugin()
      //   // // console.log('开始注册逻辑 订阅',this.$options.name);
      // }
      if( getVal(this,'$options.__file').result.startsWith('src/')){
        emitInitVmDebuPlugin()
        // // console.log('开始注册逻辑 订阅',this.$options.name);
      }
      // if(currentPageVm && currentPageVm._uid == this._uid){
      //   emitInitVmDebuPlugin()
      //   // // console.log('开始注册逻辑 订阅',this.$options.name);
      // }
    }
  }
  Vue.mixin(vmDebugPluginMixin)
  getMappWinodow = _getMappWinodow
}

export default importPlugin