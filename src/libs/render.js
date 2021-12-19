import { eachObj, getFilePathByVm, getMethodsByVm, getVal, tf, typeCheck } from "../../util";
import { $mount, creatDom, hover, mountToBody, removeMask, remove_items, setMask, setStyle } from "./dom";
import { data } from "./import";
import { elDialogDrag } from "./drag";
import inputRender from "../comps/el-input-dynamic";
import textAreaRender from "../comps/el-textarea-dynamic";
import completeRender from "../comps/el-complete-dynamic";

let Vue;
let h; // 用于存储$createElement函数
let hasElementUI; // 用户传递的配置项
let delay = 1000;
let treeNode = {};
// 初始化时渲染插件所要渲染的组件  main入口函数
function renderVmDebugPlugin(_Vue,_hasElementUI) {
    Vue = _Vue;
    hasElementUI = _hasElementUI;
    renderChooseBtn()
    const screenWidth = document.body.clientWidth // body当前宽度
    const screenHeight = document.documentElement.clientHeight // 可见区域高度(应为body高度，可某些环境下无法获取)
    let msgboxWidth =  data.msgboxWidth;
    let msgboxHeight = data.msgboxHeight;
    let left = (screenWidth - msgboxWidth) / 2;
    let top = (screenHeight - msgboxHeight) / 2;
    let pluginKey = data.pluginKey;
    let customClass = data.customClass;
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

        [`${customClass} .${boxClass}__container`]: {
            height: '100%'
          },
        [`${customClass} .el-container`]: {
            height: '100%'
          },
        [`${customClass} .el-collapse-item__wrap`]: {
            overflow: 'visible'
          },
        [`${customClass} .el-input__suffix`]: {
            cursor: 'pointer'
          },
        [`${customClass} .${boxClass}__content`]: {
            height: '100%'
          },
        [`${customClass} .${boxClass}__message`]: {
            position: 'relative',
            height: '100%'
          },

         
          [`${customClass} .more`]: {
            position: 'absolute',
            right: 0,
            [`z-index`]: '1'
          },
          [`${customClass}  .el-aside`]: {
            'background-color': '#D3DCE6',
            'color': '#333',
            'text-align':'center',
          },
          [`${customClass}  .el-tree`]: {
            'background-color': '#D3DCE6'
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
        [`${customClass} .${pluginKey}-link`]: {
            color: '#ccc',
            cursor: 'pointer'
        },
        [`${customClass} .${pluginKey}-link span.actived`]: {
            color: '#409EFF'
        },
        [`${customClass} .${pluginKey}-link.actived`]: {
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
            if (data.routeVmList.length > 0) {
                if (!data.showPhanel) {
                    data.showPhanel = true;
                    renderChoosePhanel()
                }
            }else {
                notice(data.errMsg)
            }
        }
        }
    },children:[]};
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
    },children:[]};
    let div2 = creatDom(domOptions2)
    mountToBody(div2)
}

// 需重写 以实现无elementUi 的情况
// 渲染显示的面板
export function renderChoosePhanel(){
// 保存createElement函数
if(!h){
   
    h = data.h;
}
// 如果有ui框架 就美化一下吧~
if (hasElementUI) {
    _renderChoosePhanelForElement.call(this)
} else {
    _renderChoosePhanelForNormal.call(this)
}


function _renderChoosePhanelForElement(){
    data._currentRouteKey = data.currentRouteKey;
    /** 头部信息
     * 
     * @returns 
     */
    function generateLayoutHeader() {
        let searchHandler = (filterText)=>{
            console.log(filterText);
            treeNode.componentInstance.filter(filterText);
        }
        let searchProps = {
            id: 0,
            label: '过滤搜索',
            placeholder:'支持组件名部分输入',
            icon:{
                clickHandler:searchHandler,
                type: 'search'
            }
        }
        return (
            inputRender(h,searchProps)
        )
    }
    /**内容区域
     * 
     * @returns 
     */
    function generateLayoutContent() {  
        /** 格式为 【label：】value  slot 行结构
         * 
         * @param {*} label 
         * @param {*} value 
         * @param {*} slot 
         * @returns 
         */
        function row(label, value, slot) {
            return (<p>
                <b>{label}：</b>
                <span>{value}</span>
                {slot}
            </p>)
        }
        /** 信息展示区：展示当前组件实例对应的一些信息
         * 
         * @returns 
         */
        function renderInfoPanel() {
            let infos = [{
                label: '对应文件路径',
                value: getFilePathByVm($vm)
            }, {
                label: '组件方法名',
                value: getMethodsByVm($vm).join(',')
            }]
            let content = infos.map(info => {
                let {label, value} = info
                return (
                    row(label, value)
                )
            })
            return (
                <div>
                   {content}
                </div>
            )
        }
        /** 属性处理区：获取属性对应值 对象则会挂载在window.dataObj 上并默认打印
         * 
         * @returns 
         */
        function renderDataHandlerPanel() {
            // input的配置对象
            let textAreaDataValProps = {
                id: 3,
                rows:2,
                placeholder:"属性值",
                change :(val) => {
                    $vm[getCompleteInfoInputProps.keyWord] = val
                }
            }
            /**
             * icon点击事件
             * @param {*} name 用户输入的属性名
             */
            let getInfoInputHandler = (name)=>{
                console.log(window.$vm[name]);
                let answer = ''
                
                if(typeCheck('Object')(window.$vm[name])){
                    window.dataObj = window.$vm[name]
                    answer = JSON.stringify(window.$vm[name])
                }else {
                 answer = window.$vm[name];
                }
                textAreaDataValProps.keyWord = answer;
            }
            /**
             * 当前组件实例对象上属性的模糊搜索处理函数
             * @param {*} queryString 模糊搜索关键词
             * @param {*} cb 将搜索结果传递给此回调 自动提示组件内部会用作提示列表进行渲染
             */
            function querySearch(queryString, cb) {
                function createFilter(queryString = 'ALL') {
                    return Object.keys(window.$vm.$data).filter(
                       key => {
                           if(queryString === 'ALL'){
                               return true
                           }else{
                              return   key.toLowerCase().indexOf(queryString.toLowerCase()) != -1}
                           }
                    ).map(key => ({
                        value: key,
                        label: key
                    }))
                }
                var results = queryString ? createFilter(queryString) : createFilter();
                // 调用 callback 返回建议列表的数据
                cb(results); 
            }
            // 提示input组件的配置信息
            let getCompleteInfoInputProps = {
                id: 0, // 可不填，会随机生成id 但一定要保证不重复
                label: '获取属性对应值',
                placeholder:'请输入属性名',
                iconEmit: true,//点击建议框后同时触发icon事件
                icon:{ // 支持传入icon属性 会生成右侧的icon
                    clickHandler:getInfoInputHandler,
                    type: 'bottom'
                },
                querySearch
            }
            return (<div>
                <h1 style="text-align: center">
                    请输入属性名：{completeRender(h,getCompleteInfoInputProps)}
                </h1>
                {textAreaRender(h,
                        textAreaDataValProps
                        )}
            </div>)
        }
        /** 方法执行区：直接执行模板中的方法
         * 
         * @returns 
         */
        function renderMethodExecPanel() {
            let textAreaMethodProps = {
                id: 1,
                rows:2,
                placeholder:"可以输入vue格式的methods"
            }
            // 执行方法
            let execBtn = (<el-button style="float:right;margin:10px 0" onClick={()=>{
                let regex = /(?<methodName>\w+)\((?<paramsStr>.*)\)/
                let {
                    methodName,
                    paramsStr
                } = regex.exec(textAreaMethodProps.keyWord).groups;
                let params = paramsStr.split(',');
                let newParamsStr = paramsStr;
                if(window.$vm[params[0]]){
                    newParamsStr = params.map(param=>`this.${param}`).join(',');
                }
                let func = new Function( `this.${methodName}(${newParamsStr})`);
                func.call(window.$vm)
                    }}>执行方法</el-button>)
            return (<div>
                {textAreaRender(h,
                        textAreaMethodProps
                        )}
                {row(
                    '组件方法名',
                    getMethodsByVm($vm).join(','),
                    execBtn
                )}                       
                </div>)
        }
        /** 打印执行区：在控制台中打印语句
         * 
         * @returns 
         */
        function renderLogPanel() {
            let textAreaProps = {
                id: 0,
                rows:2,
                placeholder:"执行log，当前选中的组件为this",
            }
            return (<div>
                    
                {/* 输入文本域 */}
                {textAreaRender(h,
                    textAreaProps
                )}
                <el-button  style="float:right;margin:10px 0" onClick={()=>{
                let func = new Function(`console.log(${textAreaProps.keyWord})`);
                func.call(window.$vm)
                }}>执行语句</el-button>
            </div>)
        }
        let collapseItems = [   
            {
                title: '信息展示区：展示当前组件实例对应的一些信息',
                name: 1,
                content: renderInfoPanel()
            },
            {
                title: '属性处理区：获取属性对应值 对象则会挂载在window.dataObj 上并默认打印',
                name: 2,
                content: renderDataHandlerPanel()
            },
            {
                title: '方法执行区：直接执行模板中的方法',
                name: 3,
                content: renderMethodExecPanel()
            },
            {
                title: '打印执行区：在控制台中打印语句',
                name: 4,
                content: renderLogPanel()
            }
        ]
        let items = collapseItems.map(item =>{
            let {content, title,name} = item;
            return (
                <el-collapse-item title={title} name={name}>
                    {content}
                </el-collapse-item>)
        })
        return (
            (
                <el-collapse>
                   {items}
                </el-collapse>
            )
        )
      
    }
    /**插件部分 暂未使用
     * 
     * @returns 
     */
    function generateLayoutPlugin() {
        return (
            <el-button
                class = 'more'
                onClick = {()=>{
                    data.setRouteVm(data.routeVmList.length - 1);
                    notice('重置成功')
                }}
            > 重置 </el-button>
        )
    }
    /** 侧边栏内容
     *   
     * 1. 点击查看【说明书】 抽屉组件
     * 2. 组件树结构
     * @returns 
     */
    function generateLayoutAside() {
        let options = data.routeVmList.map((routeVm,index) =>  routeVm.renderObj);
        function renderContentHandler(h, { node, data, store }) {
            let tipProps = {};
            let vmKey = node.label;
            let vm = node.data.vm;
            let tip = getFilePathByVm(vm)
            let showClothTimer;
            let flag = false;
            return (
                <el-tooltip 
                content={tip || '暂无提示内容'}
                placement={getVal(tipProps,'placement','top').result}
                effect = {getVal(tipProps,'effect','light').result}
                effect = {getVal(tipProps,'effect','light').result}
                openDelay = {getVal(tipProps,'delay',delay).result}
                >
                <el-link 
                underline={false} 
                type="text"  
                ><span
                onMouseenter={(e)=>{
                    if(vmKey.indexOf('Dialog') === -1){
                        showClothTimer = setTimeout(()=>{
                            setMask(vm.$el)
                            flag = true;
                        },delay);
                    }
                    
                    return false;
                }}
                onMouseleave={()=>{
                    if(vmKey.indexOf('Dialog') === -1){
                        clearTimeout(showClothTimer);
                        if(flag){
                            removeMask()
                            flag = false
                        }
                    }
                }}
                >{vmKey}</span>
                </el-link>
                </el-tooltip>
              );
        }
        /** 搜索过滤节点处理函数
         * 
         * @param {*} value 
         * @param {*} data 
         * @returns 
         */
        function filterNodeHandler(value, data) {
            if (!value) return true;
            return data.label.indexOf(value) !== -1;
        }
        /** 选中节点处理函数
         * 
         * @param {*} nodeData 
         */
        function checkHandler(nodeData) {
            let {label,id,vm} = nodeData;
            console.log(nodeData);
            window.$vm = vm;
            treeNode.componentInstance.setCheckedKeys([id]);
        }
        treeNode = ( 
        <el-tree
                class="filter-tree"
                data={options}
                props={{
                    children: 'children',
                    label: 'label'
                }}
                node-key="id"
                check-strictly
                show-checkbox
                accordion
                default-checked-keys={[options[options.length - 1].vm._uid]} // 默认选择最内层路由
                renderContent={renderContentHandler}
                filter-node-method={filterNodeHandler}
                onCheck={checkHandler}
                ref="tree">
            </el-tree>)
            
        return (
            <div>
                {<h1 style="cursor:pointer">组件树 | 点击查看插件描述</h1>}
                {treeNode}
            </div>
        )
    }
    /** 聚合所有部分，生成组件
     * 
     * @param {*} header 
     * @param {*} content 
     * @param {*} layoutAside 
     * @param {*} layoutPlugin 
     * @returns 
     */
    function generateLayout(header,content, layoutAside,layoutPlugin) {
        return (
            <el-container>
                <el-aside width="200px">{layoutAside}</el-aside>
                <el-container>
                    <el-header style="height: auto">{header}</el-header>
                    <el-main>{content}</el-main>
                </el-container>
            </el-container>
        )
    }
    let layoutHeader = generateLayoutHeader();
    let layoutContent = generateLayoutContent();
    let layoutAside = generateLayoutAside();
    let layoutPlugin = generateLayoutPlugin();
    let message = generateLayout(layoutHeader,layoutContent, layoutAside, layoutPlugin);
    
    Vue.prototype.$msgbox({ 
        title: '一级树节点为路由，子节点为对应组件列表',
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
    setStyle({
        [`${data.customClass}`]: {
            width: `${data.msgboxWidth}px!important`,
            height: `${data.msgboxHeight}px!important;`
        }})
    setTimeout(() => {
        elDialogDrag('vm-msgbox')
    }, 1000);
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
        },children:[]}
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