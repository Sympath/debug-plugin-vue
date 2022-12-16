import importPlugin from './libs/import';
import renderVmDebugPlugin from './libs/render';

function pluginFn(options){
  let Vue;
  function initVmDebugPlugin(){
    let data = importPlugin(Vue,options);
    // 项目是否接入了elementUi w-todo 后面可以兼容iview之类的组件库 或者自定义
    if(data.hasElementUI){
      if(!Vue.prototype.$msgbox) {
          data.hasElementUI = false; // 避免用户搞错
          alert('您没有接入elementUi哦,msgbox方法查找不到')
      }
    }   
    renderVmDebugPlugin(Vue,data.hasElementUI);
  }
  let VmDebugPlugin = {
      install(_Vue){
         Vue = _Vue
         initVmDebugPlugin()
      }
  }
  return VmDebugPlugin
}
export default pluginFn