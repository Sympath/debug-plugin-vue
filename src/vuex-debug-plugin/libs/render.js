import { typeCheck } from "../util/index";
import tableRender from "../components/we-table-dynamic";
import { creatDom, mountToBody, setStyle } from "./dom";
import { elDialogDrag } from "./drag";
import { vuexData } from "./import";


let Vue;
let h; // 用于存储$createElement函数
let hasElementUI; // 用户传递的配置项
let delay = 1000;


// 初始化时渲染插件所要渲染的组件  main入口函数
export function renderVuexDebugPlugin(_Vue,_hasElementUI) {
    Vue = _Vue;
    hasElementUI = _hasElementUI;
    renderChooseBtn()
    const screenWidth = document.body.clientWidth // body当前宽度
    const screenHeight = document.documentElement.clientHeight // 可见区域高度(应为body高度，可某些环境下无法获取)
    let msgboxWidth = 1000;
    let msgboxHeight = 500;
    let left = (screenWidth - msgboxWidth) / 2;
    let top = (screenHeight - msgboxHeight) / 2;
    let customClass = 'vuex-msgbox';
    let boxClass = 'el-message-box';
    setStyle({
        [`${customClass}`]: {
            width: `${msgboxWidth}px!important`,
            height: `${msgboxHeight}px!important;`,
            position: 'absolute',
            left: `${left}px`,
            top: `${top}px`,
            // bottom: '0',
            // right: '0',
            // margin: 'auto'
        },
        [`${customClass} .${boxClass}__message`]: {
          position: 'relative',
          [`margin-top`]: '25px'
        },
        [`${customClass} .more`]: {
          // position: 'absolute',
          // right: 0,
          // [`z-index`]: '1',
          // top: '-44px',
          // top: '-25px',
          [`margin-bottom`]: '20px',
          float: 'right'
        },
        // 关闭弹窗按钮样式
        [`${customClass} .${boxClass}__btns.is-overflow`] : {
          position:'absolute',
          'text-align': 'center',
          bottom:'0',
          right: 0,
          background: 'fff',
          border: 'none',
          "box-shadow": 'none'
        },
        [`${customClass} .${boxClass}__content`]: {
          overflow: 'srcoll',
          height: `${msgboxHeight - 48}px`
        },
        [`${customClass} .el-col-12`]:{
            height: '40px'
        },
        [`${customClass} .vuex-link`]: {
            color: '#ccc'
        },
        [`${customClass} .vuex-link span.actived`]: {
            color: '#409EFF'
        },
        [`${customClass} .vuex-link.actived`]: {
            color: '#409EFF'
        }

    })
}

// 渲染控制的按钮
function renderChooseBtn(){
    if(vuexData.notFirstRenderChooseBtn) return;
    vuexData.notFirstRenderChooseBtn = true;
    let domOptions = {tag:'div',text:'$vuex',opts:{
      style: {
        position : "fixed",
        bottom : "10px",
        left : "140px", // 70 是vmDebugPlugin的定位 后期需优化成动态的 w-todo
        cursor : "pointer",
        width: '40px',
        height: '40px',
        lineHeight: '40px',
        backgroundColor: '#38f',
        borderRidus: '50%',
        width: '40px',
        zIndex: '9999',
        fontSize: '13px',
        textAlign: 'center',
        borderRadius: '50%',
        color: 'white',
        boxShadow: '2px 3px 5px #999',
        cursor: 'pointer',
      },
      class : 'vuex_debug_class',
      on:{
        click(){
          vuexData.showPhanel = !(vuexData.showPhanel);
          renderChoosePhanel()
        }
      }
    },childrens:[]};
    let div = creatDom(domOptions)
    mountToBody(div)
    // 用于解决没有使用UI框架的情况
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
      class : 'vuex_debug_pannel_class',
      on:{
        click(){
          // notice('设置成功')
        }
      }
    },childrens:[]};
    let div2 = creatDom(domOptions2)
    mountToBody(div2)
  }

export  function generateLayoutContentForVuex(h , vm) {
  let tableProps = {
    'highlight-current-row': true,
    size: 'large',
    'header-cell-class-name': "we-table-header-cell",
    'cell-class-name': "we-table-cell",
    border: true,
    style: "width: 1000px;"
}
  // | type（commit时的type参数） | Getter（对应的属性） | API（接口地址） | APIDOCs（接口文档地址） |
function generateTableComponent(columns,list){
  return tableRender(h, {
        columns,
        tableProps,
        list
      })   
}
function generateLayoutPlugin(plugins = ['search-plugin']) {
  let pluginDoms = plugins.map(pluginName => {
    if (vuexData.pluginMap[pluginName] && typeCheck('Function')(vuexData.pluginMap[pluginName].plugin)) {
      return vuexData.pluginMap[pluginName].plugin(h,notice)
    }
    return ""
    })
  return <div class="more">
    {pluginDoms}
  </div>
}
window.vuexVnode = (
  <div>
      {generateLayoutPlugin(['search-plugin'])}
      {generateTableComponent(vuexData.tableColumnsMap[1],vuexData.targetList)}
  </div>
)
    return vuexVnode
  }

export function formatContentVnode(h, vm) {
    let tableProps = {
      'highlight-current-row': true,
      size: 'large',
      'header-cell-class-name': "we-table-header-cell",
      'cell-class-name': "we-table-cell",
      border: true,
      style: "width: 1000px;"
  }
  // | type（commit时的type参数） | Getter（对应的属性） | API（接口地址） | APIDOCs（接口文档地址） |
function generateTableComponent(columns,list){
  return tableRender(h, {
        columns,
        tableProps,
        list
      })   
}
function generateLayout(header,content, layoutFooter) {
  return h('div', {},[
      // h('el-aside', {
      //   width: '200px'
      // },[layoutAsider]),
      h('el-main', {},[content])

  ])
}
function generateLayoutPlugin(plugins = ['search-plugin']) {
let pluginDoms = plugins.map(pluginName => vuexData.pluginMap[pluginName].plugin(h,notice))
// vuexData.pluginMap.layoutPlugins.map(plugin=>plugin(h,notice))
return <div class="more">
  {pluginDoms}
</div>
}

function generateLayoutContent() {
return (
  <el-tabs 
  value='vuex'
  tab-position="left">
    <el-tab-pane label="service" name="service">
      {generateLayoutPlugin(['cache-apply-plugin','search-service-plugin'])}
      {generateTableComponent(vuexData.tableColumnsMap[2],vuexData.serviceTargetList)}
    </el-tab-pane>
    <el-tab-pane label="vuex" name="vuex">
       {generateLayoutContentForVuex(h)}
    </el-tab-pane>
  </el-tabs>
)
}
function generateLayoutHeader() {
  // 顶部功能按钮
  let children = [];
  let content = children.map(c => h(
      'el-col',{
          props: {
              span: 6
          }
      },
      [c]
  ))
  return h('el-row', {
      gutter: 20
  },content)
}
function generateLayoutFooter() {
// 顶部功能按钮
let children = [h('el-button',{
  on: {
      click(){
          
      }
  }
},'待完成功能项')];
let content = children.map(c => h(
    'el-col',{
        props: {
            span: 6
        }
    },
    [c]
))
return h('el-row', {
    gutter: 20
},content)
}
let layoutHeader = generateLayoutHeader();
let layoutContent = generateLayoutContent();
let layoutFooter = generateLayoutFooter();

return generateLayout(layoutHeader,layoutContent, layoutFooter);
}
  // 需重写 以实现无elementUi 的情况
        // 渲染显示的面板
function renderChoosePhanel(){
    // 保存createElement函数
    if(!h){
        // if(vuexData.mappChannelInstance){

        //     h = vuexData.mappChannelInstance ? vuexData.mappChannelInstance.$createElement : ()=>{ console.log('未获取h函数');};
        // }else {
        //     h = vuexData.currentPageVm ? vuexData.currentPageVm.$createElement : ()=>{ console.log('未获取h函数');};
        // }
        h = vuexData.h;
    }
    // let hasElementUI = false; // 项目是否接入了elementUi
    if(hasElementUI){
      if(!Vue.prototype.$msgbox) {
        hasElementUI = false; // 避免用户搞错
        notice('您没有接入elementUi哦,msgbox方法查找不到')
      }
    }    
    // 如果有ui框架 就美化一下吧~
    if (hasElementUI) {
      _renderChoosePhanelForElement.call(this)
    } else {
      _renderChoosePhanelForNormal.call(this)
    }
    
    function _renderChoosePhanelForElement(){
       let message = formatContentVnode(h);
      Vue.prototype.$msgbox({ 
        title: 'Vuex数据映射列表',
        message,
        customClass: 'vuex-msgbox',
        showCancelButton: false,
        showConfirmButton: true,
        showClose: false,
        center: true,
        confirmButtonText: '关闭面板',
        beforeClose: (action, instance, done) => {
          vuexData.beforeDestroys.forEach(fn => fn(vuexData))
          done()
        }
      }).then(action => {
        if(action == 'confirm'){
            
        }else {

        }
      },()=>{})
      setTimeout(() => {
        elDialogDrag('vuex-msgbox');
      }, 1000);
    }
}
export function notice(msg,type = 'success') {
  if(vuexData.Vue &&  vuexData.Vue.prototype) 
      {
        vuexData.Vue.prototype.$message({message:msg,type})
  }
  else {
      alert(msg)
  }
}