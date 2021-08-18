import { eachObj, getFilePath, getVal, tf } from "../../util";
import { $mount, creatDom, hover, mountToBody, removeMask, remove_items, setMask, setStyle } from "./dom";
import { data, getVmByKey } from "./import";


let Vue;
let h; // 用于存储$createElement函数
let hasElementUI; // 用户传递的配置项
let delay = 1000;
// 初始化时渲染插件所要渲染的组件  main入口函数
function renderVmDebugPlugin(_Vue,_hasElementUI) {
    Vue = _Vue;
    hasElementUI = _hasElementUI;
    renderChooseBtn()
    setStyle({
        'vm-msgbox': {
            width: '800px!important'
        },
        'vm-msgbox .el-col-12':{
            height: '40px'
        },
        'vm-msgbox .vm-link': {
            color: '#ccc'
        },
        'vm-msgbox .vm-link span.actived': {
            color: '#409EFF'
        },
        'vm-msgbox .vm-link.actived': {
            color: '#409EFF'
        }

    })
}

// 找到当前调试的路由页面组件 然后再进行切换
function setVm(key = 'page') {

    data.currentVueInstanceKey = key
}

// 渲染控制的按钮
export function renderChooseBtn(){
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
        zIndex: '9999',
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
            if (data.currentVmMap.size > 0) {
                if (!data.showPhanel) {
                    data.showPhanel = true;
                    renderChoosePhanel()
                }
            }else {
                notice(data.errMsg)
            }
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
        class : 'vm_debug_pannel_class',
        on:{
        }
    },childrens:[]};
    let div2 = creatDom(domOptions2)
    mountToBody(div2)
}

// 需重写 以实现无elementUi 的情况
// 渲染显示的面板
export function renderChoosePhanel(){
// 保存createElement函数
if(!h){
    // if(data.mappChannelInstance){

    //     h = data.mappChannelInstance ? data.mappChannelInstance.$createElement : ()=>{ console.log('未获取h函数');};
    // }else {
    //     h = data.currentPageVm ? data.currentPageVm.$createElement : ()=>{ console.log('未获取h函数');};
    // }
    h = data.h;
}
// 如果有ui框架 就美化一下吧~
if (hasElementUI) {
    _renderChoosePhanelForElement.call(this)
} else {
    _renderChoosePhanelForNormal.call(this)
}


function wrapTooltip(vnode,tipProps = {},other = {}) {
    tipProps.content = getVal(tipProps,'tip','暂无提示内容').result;
    tipProps.placement = getVal(tipProps,'placement','top').result;
    tipProps.effect = getVal(tipProps,'effect','light').result;
    tipProps.effect = getVal(tipProps,'effect','light').result;
    tipProps['open-delay'] = getVal(tipProps,'delay',delay).result;

    return h('el-tooltip', {
        props:{
            ...tipProps
        },
        ...other
    },[vnode])
}
function _renderChoosePhanelForElement(){
    data._currentRouteKey = data.currentRouteKey;
    function getCompList(vmMap,routeKey="") {
        let children = [];
        let span = 24/Object.keys(vmMap).length;
        eachObj(vmMap,(vmKey,vmComp)=>{
            let showClothTimer;
            let flag = false;
            children.push({
                props: {
                label: vmKey,
                span: 12,
                key: vmKey
                },
                style: {
                    textAlign: 'center'
                },
                id: `${routeKey}--${vmKey}`,
                className: `vm-link`,
                events: {
                    click(e){
                        setVm(vmKey)
                        notice(`设置成功，当前$vm指向:  ${routeKey}的${ vmKey }`)
                        // 对弹窗组件不做处理 避免出现定位错乱问题
                        // if(vmKey.indexOf('Dialog') === -1){
                        //     setMask(data.currentPageVm.$el)
                        // }
                        // window.clickObj = e.target
                    },
                    mouseenter(e){
                        if(vmKey.indexOf('Dialog') === -1){
                            showClothTimer = setTimeout(()=>{
                                setMask(getVmByKey(vmKey).$el)
                                flag = true;
                              },delay);
                        }
                        
                          return false;
                    },
                    mouseleave(){
                        if(vmKey.indexOf('Dialog') === -1){
                            clearTimeout(showClothTimer);
                            if(flag){
                                removeMask()
                                flag = false
                            }
                        }
                    }
                },
                tip:getFilePath(vmMap.get(vmKey)),
                text: vmKey,
                isCurrentVmKey: `${routeKey}--${vmKey}` === data._currentVmkey
            })
        })
        return children;
    }
    function generateRowComponent(h, opt){
        let {key,props = {}, style = {} , events = [],children = []} = opt;
        
        let components = []
        if (children) {
            components = children.map((child,index) => {
                let {key,props = {},id = '',className = '',isCurrentVmKey, style = {} ,text, events = {},tip} = child;
                let childVnode = h('span',{
                    style: {
                        cursor: 'pointer'
                    },
                    on: {
                        ...events
                    }
                },[text])
                
                return h('el-col', {
                    props,
                    style,
                    
                }, [wrapTooltip(
                    childVnode,{
                        tip
                    },{
                        attrs: {
                            id
                        },
                        class: isCurrentVmKey ?  `${className} actived` : className
                    }
                )])
            })
        }
    
        return h('el-row',{
            props: {
            ...props
            }
        },[components])
    }
    let children = data.routeVmList.map((routeVm,index) =>  {
        let compList = [];
        compList = getCompList(routeVm.vmMap,routeVm.key)
        routeVm.domList = compList;
        let content = generateRowComponent(h,{children:compList,props: {
            gutter:20
        }})
        
        return {
            content,
            props: {
                label: routeVm.key,
                name: routeVm.key,
            }
        }
    })
    function generateLayout(header,content) {
        return h('div', {},[
            h('el-header', {style: {
                paddingLeft: '60px'
            }},[header]),
            h('el-main', {},[content])
        ])
    }
    function generateLayoutHeader() {
        // 顶部功能按钮
        let children = [h('el-button',{
            on: {
                click(){
                    notice('重置成功')
                    _data.setRouteVm(data.routeVmList.length -1);
                }
            }
        },'重置')];
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
    let layoutContent = generateTabs({
        props: {
            // type: 'border-card',
            stretch: 'true',
            'tab-position':"left"
        },
        events: {
            
        },
        children
    },data,'currentRouteKey')
    let message = generateLayout(layoutHeader,layoutContent);
    function generateTabs(opt,target,targetKey) {
        let {key,props = {}, style = {} , events = [],children = []} = opt;
    
        function _genPane(list) {
            return list.map(item=>{
                let {props={},content} = item;
                return h('el-tab-pane',{
                    props: {
                        ...props,
                        key: props.name
                    }
                },[content])
            })
        }
        let value = target ? target[targetKey] : "";
        return h('el-tabs',{
            props: {
                ...props,
                value
            },
            style,
            on: {
                ...events,
                'tab-click':(item)=>{
                    // // console.log(item);
                    console.log(item.name);
                    if(target) target[targetKey] = item.name
                },
                // tabClick(){
                //     // console.log(1111);
                // }
            }
        },_genPane(children))      
    }
    Vue.prototype.$msgbox({ 
        title: '左为路由，右为对应组件列表',
        message,
        customClass: 'vm-msgbox',
        showCancelButton: false,
        showConfirmButton: true,
        showClose: false,
        confirmButtonText: '关闭面板',
        beforeClose: (action, instance, done) => {
            // 如果没有进行设置$vm 则切换路由不能影响当前属性 在关闭弹窗时需要设置currentRouteKey 为 _currentRouteKey
            data.currentRouteKey = data._currentRouteKey

            // 关闭所有组件蒙层
            removeMask()
            data.showPhanel = false;
            done()
        }
    }).then(action => {
    if(action == 'confirm'){
        
    }else {

    }
    },()=>{})
}
function _renderChoosePhanelForNormal() {
    if(data.showPhanel){
    let index = 0;
    let vmMap = data.currentVmMap;
    eachObj(vmMap,(vmKey,vmComp)=>{
        index++;
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
    })
    }else {
        remove_items('.vm_debug_pannel_class')
    }
}
}
export function notice(msg,type = 'success') {
    if(hasElementUI) 
        {
            Vue.prototype.$message({message:msg,type})
    }
    else {
        alert(msg)
    }
}

export default renderVmDebugPlugin