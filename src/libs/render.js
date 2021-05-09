import { eachObj, getFilePath } from "../../util";
import { $mount, creatDom, mountToBody, remove_items, setStyle } from "./dom";
import { emitInitVmDebuPlugin, currentPageVm, setVm, getCurrentVmMap, routeVmList, getCurrentVmKey, setCurrentPageVmIndexByKey } from "./import";

let Vue;
let h; // 用于存储$createElement函数
let hasElementUI; // 用户传递的配置项
window.data = {
    showPhanel: false,// 控制是否显示面板
    notFirstRenderChooseBtn: false
}
// 当前的路由key
Object.defineProperty(data,'currentRouteKey',{
    get(){
        return getCurrentVmKey()
    },
    set(newVal){
        setCurrentPageVmIndexByKey(newVal)
    }
})
// 初始化时渲染插件所要渲染的组件  main入口函数
function renderVmDebugPlugin(_Vue,_hasElementUI) {
    Vue = _Vue;
    hasElementUI = _hasElementUI;
    renderChooseBtn()
    setStyle({
        'vm-msgbox': {
            width: '800px!important'
        }
    })
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
            if (getCurrentVmMap().size > 0) {
                data.showPhanel = !data.showPhanel;
                renderChoosePhanel()
            }else {
                notice('组件列表为空，糟糕，大概出啥子问题了，快去提issue吧~')
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
    h = currentPageVm ? currentPageVm.$createElement : ()=>{console.log('未获取h函数');};
}
// 如果有ui框架 就美化一下吧~
if (hasElementUI) {
    _renderChoosePhanelForElement.call(this)
} else {
    _renderChoosePhanelForNormal.call(this)
}

function _renderChoosePhanelForElement(){
   
    function getCompList(vmMap) {
        let children = [];
        let span = 24/Object.keys(vmMap).length;
        eachObj(vmMap,(vmKey,vmComp)=>{
            children.push({
                props: {
                label: vmKey,
                span: 12,
                key: vmKey
                },
                style: {
                textAlign: 'center'
                },
                events: {
                click(){
                    setVm(vmKey)
                    notice(`设置成功，当前$vm指向: ${ vmKey }`)
                }
                },
                tip:getFilePath(vmMap.get(vmKey)),
                text: vmKey
            })
        })
        return children;
    }
    function generateRowComponent(h, opt){
    let {key,props = {}, style = {} , events = [],children = []} = opt;
    let components = []
    if (children) {
        components = children.map(child => {
            let {key,props = {}, style = {} ,text, events = {},tip} = child;
            
            return h('el-col', {
                props,
                style
            }, [(h('el-tooltip', {
                props:{
                content:tip || '暂无提示内容',
                placement:"top",
                effect:"light"
                }
            },[
            h('el-button', {
                props:{
                type:'text'
                },
                on: { 
                    ...events
                    }
                },text)
                ])
            )])
        })
    }
    
    return h('el-row',{
        props: {
        ...props
        }
    },[components])
    }
    let children = routeVmList.map(routeVm =>  {
        let compList = [];
        compList = getCompList(routeVm.vmMap)
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
    let message = generateTabs({
        props: {
            // type: 'border-card',
            stretch: 'true',
            'tab-position':"left"
        },
        events: {

        },
        children
    },data,'currentRouteKey')
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
        return h('el-tabs',{
            props: {
                ...props,
                value: target[targetKey]
            },
            style,
            on: {
                ...events,
                'tab-click':(item)=>{
                    // console.log(item);
                    target[targetKey] = item.name
                },
                // tabClick(){
                //     console.log(1111);
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
    let vmMap = getCurrentVmMap();
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