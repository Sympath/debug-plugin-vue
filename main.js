import mappPluginFn from './mappPlugin';
import vmPluginFn from './vmPlugin';
import {callFn} from './util';

// 用户传过来的配置项
export default  function pluginWrapper(options) {
  // 是否是微应用，如果是子应用则暴露子应用的插件
  let {
    isMapp,
    isDev
  } = options;
  // 如果是dev环境 才继续执行
  if(callFn(isDev,window.location)){
    // 如果是子应用 则加载子应用的插件
    if(isMapp){
      return mappPluginFn(options)
    }
    // 否则 加载主应用的插件
    else{
      return vmPluginFn(options)
    }
  }
  
}

