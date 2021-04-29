import mappPluginFn from './mappPlugin';
import vmPluginFn from './vmPlugin';

// 用户传过来的配置项
export default  function pluginWrapper(options) {
  // 是否是微应用，如果是子应用则暴露子应用的插件
  let {
    isMapp
  } = options;
  if(isMapp){
    return mappPluginFn(options)
  }else{
    return vmPluginFn(options)
  }
}

