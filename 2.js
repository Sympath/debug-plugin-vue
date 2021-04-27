let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map
let Vue;
let h;
function initVmDebugPlugin(){
    let data = {
      showPhanel: false,// 控制是否显示面板
      notFirstRenderChooseBtn: false,
      current: '' // 当前选中的组件
    }
   
    importPlugin();
    // initData(data);
    renderVmDebugPlugin();
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
        // 在页面跳转时清空插件
        beforeRouteLeave(to, from, next){
          vmMap = {};
          if(window.$vm) window.$vm = {};
          next()
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
                if(!(vmMap._vm)){
                  Object.defineProperty(vmMap,'_vm',{
                    enumerable:false,
                    get(){
                      return vmMap[`${vmKey}`]
                    }
                  })
                }
                // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
                // 1. 注册时传递一个key 作为当前vm的唯一标识
                // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
                // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
                window.setVm = function (vmKey = '') {
                  data.current = vmKey;
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
    // 渲染插件
    function renderVmDebugPlugin() {
      renderChooseBtn()
      // renderChoosePhanel()
    }
    // 渲染控制的按钮
    function renderChooseBtn(){
      if(data.notFirstRenderChooseBtn) return;
      data.notFirstRenderChooseBtn = true;
      let domOptions = {tag:'div',text:'$vm',opts:{
        style: {
          position : "fixed",
          bottom : "10px",
          left : "70px",
          cursor : "pointer",
          width: '40px',
          height: '40px',
          lineHeight: '40px',
          backgroundColor: '#38f',
          borderRidus: '50%',
          width: '40px',
          zIndex: '1024',
          fontSize: '13px',
          textAlign: 'center',
          borderRadius: '50%',
          color: 'white',
          boxShadow: '2px 3px 5px #999',
          cursor: 'pointer',
        },
        class : 'vm_debug_class',
        on:{
          click(){
            if (Object.keys(vmMap).length > 0) {
              // 先缓存一下，如果取消了，则不改变指向 
              // data.currentCache = data.current;
              data.showPhanel = true;
              renderChoosePhanel()
            }else {
              Vue.prototype.$message('组件列表为空，去设置name吧~')
            }
            
          }
        }
      },childrens:[]};
      let div = creatDom(domOptions)
      mountToBody(div)
    }
    // 渲染显示的面板
    function renderChoosePhanel(){       
        // 保持此函数 不然如果是微前端状态下，下次渲染时会找不到，从而渲染失败
          if(!h){
            h = vmMap._vm ? vmMap._vm.$createElement : ()=>{};
          }
          let compList = [];
          if(vmMap.friday && Object.keys(vmMap).length == 1 && $vm.app){
            vmMap = $vm.app.sandbox.proxy.vmMap;
          }
          function getCompList(vmMap) {
            let children = [];
            let span = 24/Object.keys(vmMap).length;
            for (const vmKey in vmMap) {
              if (Object.hasOwnProperty.call(vmMap, vmKey)) {
                const $vm = vmMap[vmKey];
                children.push({
                  props: {
                    label: vmKey,
                    span: 12,
                    key: vmKey
                  },
                  text: vmKey
                })
              }
            }  
            return children;
          }
          compList = getCompList(vmMap)
          
          function generateRowComponent(h, opt, formData = {}){
            let {key,props = {}, style = {} , events = [],children = []} = opt;
            let components = []
            if (children) {
                components = children.map(child => {
                    let {key,props = {}, style = {} ,text, events = {},children = []} = child;
                    return h('el-col', {
                        props: child.props? child.props : child
                    }, [h('el-button',{
                      on: {
                        click(){
                          data.current = text;
                          setVm(data.current)
                          Vue.prototype.$message(`设置成功，当前$vm指向: ${ data.current }`)
                        }
                      },
                      props: {
                        type: 'text'
                      }
                    },[text])])
                })
            }
            return h('el-row',{
              props: {
                ...props
              }
            },[components])
          }
          let message = generateRowComponent(h,{children:compList,props: {
            gutter:"20"
          }})
          Vue.prototype.$msgbox({ 
            title: '组件列表',
            message,
            showCancelButton: false,
            showConfirmButton: true,
            showClose: false,
            confirmButtonText: '关闭面板',
            beforeClose: (action, instance, done) => {
              done()
            }
          }).then(action => {
            if(action == 'confirm'){
                
            }else {
              // data.current = data.currentCache;
            }
            data.showPhanel = false;
          },()=>{})
        
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
}
let VmDebugPlugin = {
    install(_Vue){
      Vue = _Vue
      // 只在本地开发的时候生效，避免污染线上
      let isLocal = false;
      if (location.host.indexOf(8082) !== -1 || location.host.indexOf('test') !== -1 ) {
        isLocal = true
      }
      if(isLocal){
        // Vue.prototype.$message('VmDebugPlugin install success')
        initVmDebugPlugin(Vue)
      }
    }
}

export default VmDebugPlugin;