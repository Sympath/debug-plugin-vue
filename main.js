let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map
let Vue;
function initVmDebugPlugin(){
    let data = {
      showPhanel: false,// 控制是否显示面板
      notFirstRenderChooseBtn: false
    }
   
    importPlugin();
     // new Vue(data)
    function importPlugin(){
      let vmDebugPluginMixin = {
        mounted(){
          // this.$message('instal success')
          // 作为标识  w-todo 去了解下能不能用router.currentRoute+_componentTag优化掉
          let name = this.$options.d_name;
          if(name){
            if(name.startsWith('p_')){
              name = name.replace('p_','');
              this.setVmInstance(name,true);
            }else {
                //如果已经存在name了或者是组件 则注册但不默认指向; 
                if(name && name.startsWith('c_')){
                  name = name.replace('c_','');
                }
                this.setVmInstance(name);
            }
          }
        },
        methods:{
           /**
             * 在window上持有当前的vm实例从而方便调试 $vm 默认指向当前页面
             * @param {*} vmKey 唯一key
             * @param {*} isPage 是否为当前页面   从而实现  $vm默认指向当前页面
             */  
            setVmInstance (vmKey = '',isPage = false) {
            

                vmKey = vmKey ? vmKey : '$vm';
                vmMap[`${vmKey}`] = this;
                // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
                // 1. 注册时传递一个key 作为当前vm的唯一标识
                // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
                // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
                window.setVm = function (vmKey = '') {
                  window.$vm = vmMap[`${vmKey}`];
                  // 子应用的vue实例  如果是在微应用里 则1. 在微应用对应页面的mounted中调用setVmInstance 2. 在控制台调用下这个方法 就可以在$fVm上取值了
                  window.$vm.setFVm = function (key = '') {
                    key && window.$vm.app.sandbox.proxy.setVm(key); // 传递了key则是更改子应用中的$vm指向 不传则默认走子应用中的页面vue实例
                    window.$fVm = window.$vm.app.sandbox.proxy.$vm;
                  };
                };
                // 是当前页面 则默认执行一次挂载 将$vm指向当前页面的vue实例  可以调用setVm从而改为指向页面中组件的实例
                isPage && setVm(vmKey);
            }
        }
      }
      Vue.mixin(vmDebugPluginMixin)
    }
}
let VmDebugPlugin = {
    install(_Vue){
      Vue = _Vue
      let localTags = ['localhost','test', '8082'];
      // 只在本地开发的时候生效，避免污染线上
      let isLocal = localTags.some(item => location.host.indexOf(item) != -1);
      if(isLocal){
        initVmDebugPlugin(Vue)
      } 
    }
}

export default VmDebugPlugin;
