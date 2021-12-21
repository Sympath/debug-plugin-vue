import textAreaRender from "../comps/el-textarea-dynamic";

        /** 打印执行区：在控制台中打印语句
         * 
         * @returns 
         */
         function renderLogPanel(h, vm) {
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
                func.call(vm)
                }}>执行语句</el-button>
            </div>)
        }


        export default {
            title: '打印执行区：在控制台中打印语句',
            render:renderLogPanel};