import { getMethodsByVm } from "../../util/index";
import { typeCheck } from "../../util/index";
import textAreaRender from "../comps/el-textarea-dynamic";
import completeRender from "../comps/el-complete-dynamic";

/** 方法执行区：直接执行模板中的方法
 * 
 * @returns 
 */
function renderMethodExecPanel(h, vm) {
    let textAreaMethodProps = {
        id: 1,
        rows:2,
        placeholder:"可以输入vue格式的methods"
    }
    // 执行方法
    let execBtn = (<el-button style="margin-left: 10px" onClick={()=>{
        // textAreaMethodProps.renderData && (textAreaMethodProps.renderData.showSuggest = false)
        let regex = /(?<methodName>\w+)\((?<paramsStr>.*)\)/
        let {
            methodName,
            paramsStr
        } = regex.exec(textAreaMethodProps.keyWord).groups;
        let params = paramsStr.split(',');
        let newParamsStr = paramsStr;
        if(vm[params[0]]){
            newParamsStr = params.map(param=>`this.${param}`).join(',');
        }
        let func = new Function( `this.${methodName}(${newParamsStr})`);
        func.call(vm)
            }}>执行方法</el-button>)
             /**
     * icon点击事件
     * @param {*} methodName 用户输入的方法名
     */
    let getInfoInputHandler = (methodName)=>{
        let answer = ''
        if(typeCheck('Function')(vm[methodName])){
            window.dataObj = vm[methodName]
            answer = `${methodName}()`;
            textAreaMethodProps.keyWord = answer;
        }else {
            console.error(`输出的${methodName}不是函数`)
        }
    }
    /**
     * 当前组件实例对象上属性的模糊搜索处理函数
     * @param {*} queryString 模糊搜索关键词
     * @param {*} cb 将搜索结果传递给此回调 自动提示组件内部会用作提示列表进行渲染
     */
     function querySearch(queryString, cb) {
        function createFilter(queryString = 'ALL') {
            return getMethodsByVm(vm).filter(
               methodName => {
                   if(queryString === 'ALL'){
                       return true
                   }else{
                      return   methodName.toLowerCase().startsWith(queryString.toLowerCase());
                }}
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
        id: 1, // 可不填，会随机生成id 但一定要保证不重复
        placeholder:'快捷搜索方法名',
        iconEmit: true,//点击建议框后同时触发icon事件
        icon:{ // 支持传入icon属性 会生成右侧的icon
            clickHandler:getInfoInputHandler,
            type: 'bottom'
        },
        querySearch
    }
    return (<div>
        {textAreaRender(h,
                textAreaMethodProps
                )}
        {/* {row(
            '组件方法名',
            getMethodsByVm(vm).join(','),
            execBtn
        )}                        */}
        <div style="float:right;margin:10px 0">
            {completeRender(h,getCompleteInfoInputProps)}
            {execBtn}
        </div>
        </div>)
}


export default {
    title: '方法执行区：直接执行模板中的方法',
    render:renderMethodExecPanel};