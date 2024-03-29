import { notice } from './src/libs/render';
import mappPluginFn from './src/mappPlugin';
import vmPluginFn from './src/vmPlugin';
import {callFn} from './util/index.js';
import vuexDebugPlugin from './src/vuex-debug-plugin/index';

let _Vue;
// 用户传过来的配置项
export default function pluginWrapper(options) {
  // 是否是微应用，如果是子应用则暴露子应用的插件
  let {
    isMapp,
    isDev
  } = options;
 
  function initPlugin() {
     // 如果是子应用 则加载子应用的插件
     if(isMapp){
      return mappPluginFn(options)
    }
    // 否则 加载主应用的插件
    else{
      return vmPluginFn(options)
    }
  }
  // 如果是dev环境 才继续执行
  if(callFn(isDev,window.location)){
    return initPlugin();
  }else {
    return {
      install(Vue){
        _Vue = Vue;
        setTimeout(() => {
          (window._vmDebugger || {}).open = () => {
            _Vue.use(initPlugin())
            _Vue.prototype.$message({message:'已开启调试插件 需切换菜单后生效'})
          }
        }, 3000);
      }
    }
  }
  
}



export function vuexDebugPluginFn(options) {
  // 是否是微应用，如果是子应用则暴露子应用的插件
  let {
    isDev
  } = options;
  // 如果是dev环境 才继续执行
  if(callFn(isDev,window.location)){
    return vuexDebugPlugin(options)
  }else {
    return ()=>{}
  }
  
}