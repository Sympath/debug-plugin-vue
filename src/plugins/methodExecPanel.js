import { getMethodsByVm } from "../../util";
import textAreaRender from "../comps/el-textarea-dynamic";

/** 方法执行区：直接执行模板中的方法
 * 
 * @returns 
 */
function renderMethodExecPanel(h, vm) {
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
        </div>)
}


export default {
    title: '方法执行区：直接执行模板中的方法',
    render:renderMethodExecPanel};