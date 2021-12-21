import { typeCheck } from "../util/index";
import tableRender from "../components/we-table-dynamic";
import { vuexData } from "./import";


/** 生成vuex插件面板主题内容
 * 
 * @param {*} h 
 * @param {*} vm 
 * @returns 
 */
export  function generateLayoutContentForVuex(h , vm) {
  /**
   * 渲染vuex插件区域
   * @param {*} plugins 
   * @returns 
   */
  function generateLayoutPlugin(plugins = ['search-plugin']) {
    // 先获取插件对应vnode
    let pluginVnodes = plugins.map(pluginName => {
      if (vuexData.pluginMap[pluginName] && typeCheck('Function')(vuexData.pluginMap[pluginName].plugin)) {
        return vuexData.pluginMap[pluginName].plugin(h,notice)
      }
      return ""
    })
    return <div class="more">
      {pluginVnodes}
    </div>
  }
    /** 生成表格
   * | type（commit时的type参数） | Getter（对应的属性） | API（接口地址） | APIDOCs（接口文档地址） |
   * @param {*} columns 
   * @param {*} list 
   * @returns 
   */
  function generateTableComponent(columns,list){
    // 表格对应配置
    let tableProps = {
      'highlight-current-row': true,
      size: 'large',
      'header-cell-class-name': "we-table-header-cell",
      'cell-class-name': "we-table-cell",
      border: true,
      style: "width: 1000px;"
    }
    return tableRender(h, {
          columns,
          tableProps,
          list
        })   
  }
  let vuexVnode = (
    <div>
        {generateLayoutPlugin(['search-plugin'])}
        {generateTableComponent(vuexData.tableColumnsMap[1],vuexData.targetList)}
    </div>
  )
  return vuexVnode
}

export function notice(msg,type = 'success') {
  if(vuexData.Vue &&  vuexData.Vue.prototype) {
    vuexData.Vue.prototype.$message({message:msg,type})
  }
  else {
      alert(msg)
  }
}