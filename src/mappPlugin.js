
function pluginFn(options){
  let Vue;
  function initVmDebugPlugin() {
    let vmDebugPluginMixin = {
      beforeRouteEnter (to, from, next) {
        next(vm => {
          $vm = vm;
        })
      },
      methods:{
         /**
           * 在window上持有当前的vm实例从而方便调试 $vm 默认指向当前页面
           * @param {*} vmKey 唯一key
           * @param {*} isPage 是否为当前页面   从而实现  $vm默认指向当前页面
           */  
          setVmInstance (vmKey = '',isPage = false) {
              vmKey = vmKey ? vmKey : '$vm';
              // 解决v-if的问题
              if (!vmMap.has(vmKey)) {
                vmMap.set(vmKey , this);
              }
              // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
              // 1. 注册时传递一个key 作为当前vm的唯一标识
              // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
              // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
              window.setVm = function (vmKey = '') {
                window.$vm = vmMap.get(vmKey);
              };
              // 是当前页面 则默认执行一次挂载 将$vm指向当前页面的vue实例  可以调用setVm从而改为指向页面中组件的实例
              isPage && setVm(vmKey);
          }
      }
    }
    Vue.mixin(vmDebugPluginMixin)
  }

  let VmDebugPlugin = {
      install(_Vue){
          Vue = _Vue
          window.$vm = {}; // 子应用中只做一件事，将当前最深路由屁哦配到的组件进行挂载在$vm上，便于getMappWinodow获取
          initVmDebugPlugin(Vue)
      }
  }
  return VmDebugPlugin
};

 // 用户的配置项
export default pluginFn

