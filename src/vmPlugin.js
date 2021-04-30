

import {callFn} from '../util';
function pluginFn(options){
  let Vue;
  let h; // 用于存储$createElement函数
  let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map
  let {
    getMappWinodow, // 获取子应用全局变量的函数 如果无返回值正常渲染即可
    hasElementUI  // 项目是否接入了elementUi w-todo 后面可以兼容iview之类的组件库 或者自定义
  } = options;
  function initVmDebugPlugin(){
    let data = {
        showPhanel: false,// 控制是否显示面板
        notFirstRenderChooseBtn: false
    }
    importPlugin();
    renderVmDebugPlugin();
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
                  window.$vm = vmMap[`${vmKey}`];
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
              data.showPhanel = !data.showPhanel;
              renderChoosePhanel()
            }else {
             notice('组件列表为空，去设置name吧~')
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
            // notice('设置成功')
          }
        }
      },childrens:[]};
      let div2 = creatDom(domOptions2)
      mountToBody(div2)
      
    }
    // 需重写 以实现无elementUi 的情况
    // 渲染显示的面板
    function renderChoosePhanel(){
      // let hasElementUI = false; // 项目是否接入了elementUi
    if(hasElementUI){
      if(!Vue.prototype.$msgbox) {
        hasElementUI = false; // 避免用户搞错
        notice('您没有接入elementUi哦,msgbox方法查找不到')
      }
    }
      // 保存createElement函数
      if(!h){
        h = vmMap._vm ? vmMap._vm.$createElement : ()=>{};
      }
      try {
        // q: 待梳理 如何支持微应用控制面板的判断 从而接入微应用 
        // a: 用户传递一个获取子应用全局变量的函数，会在执行时传递当前的组件Map，此函数中应判断如果符合子应用逻辑，则将vmMap交由子应用进行托管
        let mappWinodow = callFn(getMappWinodow,vmMap);
        if (mappWinodow && mappWinodow.vmMap) {
          vmMap = mappWinodow.vmMap
        } 
      } catch (error) {
        console.log('获取子应用的函数错误：',error);
      }
        
        // 如果有ui框架 就美化一下吧~
        if (hasElementUI) {
          _renderChoosePhanelForElement.call(this)
        } else {
          _renderChoosePhanelForNormal.call(this)
        }
        
        function _renderChoosePhanelForElement(){
          let compList = [];
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
                  style: {
                    textAligin: 'center'
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
                        props,
                        style
                    }, [h('div',{
                      on: {
                        click(){
                          setVm(text)
                          notice(`设置成功，当前$vm指向: ${ text }`)
                        }
                      },
                      style: {
                        color: '#38f',
                        fontSize: '18px',
                        textAlign: 'center',
                        cursor: 'pointer'
                      },
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
            gutter:20
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

            }
          },()=>{})
        }
        function _renderChoosePhanelForNormal() {
          function remove_items(className) {
            var pannel = document.querySelector(className)
            pannel.innerHTML = ""
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
                          notice('设置成功，当前$vm指向：'+vmKey)
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
            remove_items('.vm_debug_pannel_class')
          }
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
    function notice(msg,type = 'success') {
      if(hasElementUI) Vue.prototype.$message({message:msg,type})
      else {
        alert(msg)
      }
    }
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