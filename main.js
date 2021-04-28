let VmDebugPlugin = {
  install(Vue){
    let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map
    let hasElementUI = false; // 项目是否接入了elementUi
    if(Vue.prototype.$msgbox) {
      hasElementUI = true;
    }
    initVmDebugPlugin(Vue)
    function initVmDebugPlugin(){
      let data = {
        showPhanel: false,// 控制是否显示面板
        notFirstRenderChooseBtn: false
      }
     
      importPlugin();
      initData(data);
      renderVmDebugPlugin();
       // new Vue(data)
      function importPlugin(){
        let vmDebugPluginMixin = {
          mounted(){
            // this.$message('instal success')
            let name = this.$options.name;
            if(name){
              if(name.startsWith('p_')){
                name = name.replace('p_','');
                this.setVmInstance(name,true);
              }else {
                  // w-todo 如果已经存在name了或者是组件 则注册但不默认指向; 去了解下能不能用_componentTag优化掉
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
                // 只在本地开发的时候生效，避免污染线上
                let isLocal = location.host.indexOf(8082) !== -1;
                if (isLocal) {
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
        }
        Vue.mixin(vmDebugPluginMixin)
      }
      // 初始化数据
      function initData(data){
        walk(data)
        function walk(data){
          let keys = Object.keys(data);
          keys.forEach(key=>{
              defineReactuve(data,key,data[key]);
          })
        } 
        function defineReactuve(data,key,value){
          
          Object.defineProperty(data,key,{
            get(){
              return value;
            },
            set(newVal){
              if(value == newVal) return;
              value = newVal;
              renderVmDebugPlugin()
            }
          })
        }
      }
      // 渲染插件
      function renderVmDebugPlugin() {
        renderChooseBtn()
        renderChoosePhanel()
      }
      // 渲染控制的按钮
      function renderChooseBtn(){
        if(data.notFirstRenderChooseBtn) return;
        data.notFirstRenderChooseBtn = true;
        let domOptions = {tag:'div',text:'$vm调试',opts:{
          style: {
            position : "fixed",
            bottom : "200px",
            left : "200px",
            cursor : "pointer"
          },
          class : 'vm_debug_class',
          on:{
            click(){
              if (Object.keys(vmMap).length > 0) {
                data.showPhanel = !(data.showPhanel);  
              }else {
                Vue.prototype.$message('组件列表为空，去设置name吧~')
              }
              
            }
          }
        },childrens:[]};
        let div = creatDom(domOptions)
        mountToBody(div)
        let domOptions2 = {tag:'div',text:'',opts:{
          style: {
            position : "fixed",
            // bottom : "200px",
            // left : "0",
            // right : "0",
            // top : "0",
            // bottom : "0",
            cursor : "pointer"
          },
          class : 'vm_debug_pannel_class',
          on:{
            click(){
              Vue.prototype.$message('设置成功')
            }
          }
        },childrens:[]};
        let div2 = creatDom(domOptions2)
        mountToBody(div2)
        
      }
      // 渲染显示的面板
      function renderChoosePhanel(){
          function remove_items(className) {
            var products = document.getElementsByClassName(className)
            console.log('remove',products && products[0]);
            if(products && products.length>0) {
              var parent = products[0].parentNode;
              for(let i = products.length; i>= 0; i--) {
                parent && (parent.innerHTML = '');
              }
            }else {
              return
            } 
          }
          if(data.showPhanel){
            let index = 0;
            for (const vmKey in vmMap) {
              index++;
              if (Object.hasOwnProperty.call(vmMap, vmKey)) {
                const $vm = vmMap[vmKey];
                let domOptions = {tag:'div',text:vmKey,opts:{
                      style: {
                        position : "fixed",
                        bottom : "500px",
                        left : `${index*200+400}px`,
                        cursor : "pointer",
                        zIndex: 99
                      },
                      class : 'vm_pannel_class',
                      on:{
                        click(e){
                          // 更改$vm指向
                          setVm(vmKey);
                          e.preventDefault()
                        }
                      }
                    },childrens:[]}
                let listItem = creatDom(domOptions)
                // mountToBody(listItem)
                $mount('.vm_debug_pannel_class',listItem)
              }
            } 
          }else {
            remove_items('vm_pannel_class')
          }
      }
      function mountToBody(dom){
        var bo = document.body; //获取body对象.
        //动态插入到body中
        bo.insertBefore(dom, bo.lastChild);
      }
      function creatDom(domOpts){
            let {tag,text,opts,childrens} = domOpts;
                        //创建一个div
            var dom = document.createElement(tag);
            dom.innerHTML = text; //设置显示的数据，可以是标签．
      
            for (const key in opts) {
              if(key === 'style'){
                let styleOpts = opts[key];
                for (const styleKey in styleOpts) {
                  dom.style[styleKey] = styleOpts[styleKey]
                }
              }
              if (key === 'class') {
                dom.className = opts[key];
              }
              if (key === 'on') {
                let eventOpts = opts[key];
                for (const eventKey in eventOpts) {
                  let fn = eventOpts[eventKey]
                  dom.addEventListener(eventKey,fn)
                }
              }
            }
            childrens.forEach(child => { 
              return dom.appendChild(createElm(child));
            });
            return dom;
      }
      function $mount(el,dom){
        el = document.querySelector(el);
        el.appendChild(dom);
      }
    }
  }
}

export default VmDebugPlugin

