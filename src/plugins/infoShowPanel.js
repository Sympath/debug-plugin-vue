import { getFilePathByVm, getMethodsByVm } from "../../util/index"



/** 信息展示区：展示当前组件实例对应的一些信息
 * 
 * @returns 
 */
function renderInfoPanel(h, vm) {
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
    let infos = [{
        label: '对应文件路径',
        value: getFilePathByVm(vm)
    }, {
        label: '组件方法名',
        value: getMethodsByVm(vm).join(',')
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

export default {
    title: '信息展示区：展示当前组件实例对应的一些信息',
    render: renderInfoPanel
};