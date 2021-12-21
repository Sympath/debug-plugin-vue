import { typeCheck } from "../../util/index";
import completeRender from "../comps/el-complete-dynamic";
import textAreaRender from "../comps/el-textarea-dynamic";
 /** 属性处理区：获取属性对应值 对象则会挂载在window.dataObj 上并默认打印
         * 
         * @returns 
         */
  function renderDataHandlerPanel(h, vm) {
    // input的配置对象
    let textAreaDataValProps = {
        id: 3,
        rows:2,
        placeholder:"属性值",
        change :(val) => {
            vm[getCompleteInfoInputProps.keyWord] = val
        }
    }
    /**
     * icon点击事件
     * @param {*} name 用户输入的属性名
     */
    let getInfoInputHandler = (name)=>{

        let answer = ''
        
        if(typeCheck('Object')(vm[name])){
            window.dataObj = vm[name]
            answer = JSON.stringify(vm[name])
        }else {
         answer = vm[name];
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
            return Object.keys(vm.$data).filter(
               key => {
                   if(queryString === 'ALL'){
                       return true
                   }else{
                      return   key.toLowerCase().startsWith(queryString.toLowerCase());
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


export default {
    title: '属性处理区：获取属性对应值 对象则会挂载在window.dataObj 上并默认打印',
    render:renderDataHandlerPanel};