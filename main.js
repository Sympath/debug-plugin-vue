let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map

export default {
  methods: {
    setVmInstance (vmKey = '',isPage = false) {
      // 只在本地开发的时候生效，避免污染线上
      let isLocal = location.host.indexOf(8082) != -1;
      if(isLocal){
        window[`$vm${key}`] = this;
        let isLocal = location.host.indexOf(8082) !== -1;
        if (isLocal) {
          vmMap[`$vm${vmKey}`] = this;
          // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
          // 1. 注册时传递一个key 作为当前vm的唯一标识
          // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
          // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
          window.setVm = function (vmKey = '') {
            window.$vm = vmMap[`$vm${vmKey}`];
          };
          // 是当前页面 则默认执行一次挂载 将$vm指向当前页面的vue实例  可以调用setVm从而改为指向页面中组件的实例
          isPage && setVm(vmKey);
        }
      }
    }
  }
}