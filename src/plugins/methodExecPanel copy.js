import { set } from "shelljs";
import { getMethodsByVm } from "../../util";
import textAreaRender from "../comps/el-textarea-dynamic";

/** 方法执行区：直接执行模板中的方法
 * 
 * @returns 
 */
function renderMethodExecPanel(h, vm) {
    let renderData = {
        
    }
    let _showDraw = false
    Object.defineProperty(renderData, 'showDraw', {
        get(){
            return _showDraw
        },
        set(newVal){
            _showDraw= newVal;
            drawerVnodeRender()
        }
    })
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

    let textAreaMethodProps = {
        id: 1,
        rows:2,
        placeholder:"可以输入vue格式的methods"
    }
    function renderDrawerVnode() {
        return (<el-drawer
            title="我是标题"
            visible={ renderData.showDraw }
            direction="direction"
            before-close="handleClose">
            <span>我来啦!</span>
        </el-drawer> )
    }
    let drawerVnode = renderDrawerVnode();
      
    function drawerVnodeRender() {
        drawerVnode.componentInstance.__patch__(drawerVnode, renderDrawerVnode())
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
        if(window.vm[params[0]]){
            newParamsStr = params.map(param=>`this.${param}`).join(',');
        }
        let func = new Function( `this.${methodName}(${newParamsStr})`);
        func.call(window.vm)
            }}>执行方法</el-button>)
            
    return (<div>
        {textAreaRender(h,
                textAreaMethodProps
                )}
        {row(
            '组件方法名',
            getMethodsByVm(vm).join(','),
            execBtn
        )}   
        <el-button onClick={  ()=>{renderData.showDraw = true}} type="primary" style="margin-left: 16px;">
            点我打开
        </el-button>     
        {/* {drawerVnode}         */}
        </div>)
}


export default {
    title: '方法执行区：直接执行模板中的方法',
    render:renderMethodExecPanel};