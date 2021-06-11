import importPlugin from './libs/import';
import renderVmDebugPlugin from './libs/render';

function pluginFn(options){
  let Vue;
  let {
    getMappWinodow, // 获取子应用全局变量的函数 如果无返回值正常渲染即可
    hasElementUI,  // 项目是否接入了elementUi w-todo 后面可以兼容iview之类的组件库 或者自定义
    mappPanelKey // 定义在微应用的主应用中控制面板d_name的值
  } = options;
  function initVmDebugPlugin(){
    importPlugin(Vue,getMappWinodow,mappPanelKey);
    // let hasElementUI = false; // 项目是否接入了elementUi
    if(hasElementUI){
      if(!Vue.prototype.$msgbox) {
          hasElementUI = false; // 避免用户搞错
          alert('您没有接入elementUi哦,msgbox方法查找不到')
      }
    }   
    renderVmDebugPlugin(Vue,hasElementUI);
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