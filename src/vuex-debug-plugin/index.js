import {typeCheck, compareObj, getStateByType, getActionByType} from './util/index';
import importPlugin, { vuexData, mapCache, noNeedResolve } from './libs/import';
import { generateLayoutContentForVuex } from './libs/render';
function pluginFn(options){
    let h; // 用于存储$createElement函数
    let {
        hasElementUI,  // 项目是否接入了elementUi w-todo 后面可以兼容iview之类的组件库 或者自定义
        Vue
    } = options;
    
    function initVuexDebugPlugin(){
        importPlugin(Vue,options);
        // renderVuexDebugPlugin(Vue, hasElementUI);
    }
    function vuexDebugPlugin() {
        return function (store) {
            h = typeCheck('Function')(store._vm.$createElement) ? store._vm.$createElement : () => {
                console.log('未获取到$createElement');
            }
            let allModules = store._modules.root._children;
            // let preState = JSON.parse(JSON.stringify(store.state));
            initVuexDebugPlugin()
            store.subscribe((mutations,state) => {
              let [moduleName, type] = mutations.type.split('/');
              // 如果是不需要处理的数据 则直接返回
              if(noNeedResolve(moduleName, type)){
                return;
              }
              let module = allModules[moduleName]._rawModule;
              // 缓存机制
              let cacheItems = mapCache(moduleName, type, module);
              if(cacheItems && typeCheck('Array')(cacheItems)){
                vuexData.targetList.push(...cacheItems);
                return;
              }
              let rootService = vuexData.serviceMap[moduleName] ?  Object.assign(vuexData.serviceMap[moduleName], vuexData.serviceMap.common) : vuexData.serviceMap.common;
              let states = getStateByType(type,module);
              let actions = getActionByType(type,module,rootService);
              // 根据收集到的信息组装表格数据
              /**
               * {
                moduleName: 模块名,
                getter: ,
                action: 触发的action,
                api: 对应接口
                annotation: 备注
              }
               * 
               */
              // 可能是直接触发的mutation 所以需要判断一下
              if(actions.length > 0){
                for (let index = 0; index < actions.length; index++) {
                  const {
                    action,
                    apis
                  } = actions[index];
                  // 如果是一块数据，那就只渲染第一个type
                  let showType = "同上一列"
                  if(index == 0){
                    showType = `${moduleName}模块下${type}`
                  }
                  vuexData.targetList.push({
                    showType,
                    type,
                    moduleName,
                    getter: states.join(','),
                    action,
                    api: apis.join(';'),
                    annotation: ''
                    // ...(sourceMap[type])
                  })
                }
              }else {
                vuexData.targetList.push({
                  showType: `${moduleName}模块下${type}`,
                  type,
                  moduleName,
                  getter: states.join(','),
                  action: '未触发action',
                  api: '',
                  annotation: ''
                  // ...(sourceMap[type])
                })
              }
              
              
              // console.log(states, actions);
                // if(sourceMap[type]){
                //   if(moduleName === sourceMap[type].moduleName || sourceMap[type].moduleName === '*'){
                //     let changeKeys = compareObj(preState,state,2);
                //     console.log(changeKeys);
                //     debugger
                //     let hased = vuexData.targetList.some(item=>{
                //       // if((item.moduleName === moduleName ) && item.type === type){
                //         // 现在数据不多，很多数据moduleName并没有存而是用*暂位，再加上
                //       if((item.moduleName === moduleName ) && item.type === type){
                //          return true 
                //      } 
                //    })
                //   //  如果已经有了则不要再存了
                //    if (hased) {
                //      return;
                //    }
                   
                //   }
                  
                // }
                // console.log('=========',mutations,state);
            })
        }
    }
    return vuexDebugPlugin
}
export default pluginFn



export let vuexDebugPannelPlugin = {
  title: 'vuex',
  render: generateLayoutContentForVuex
}
