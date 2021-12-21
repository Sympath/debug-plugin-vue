

// export  function generateLayoutContentForVuex(h , vm) {
//     let tableProps = {
//       'highlight-current-row': true,
//       size: 'large',
//       'header-cell-class-name': "we-table-header-cell",
//       'cell-class-name': "we-table-cell",
//       border: true,
//       style: "width: 1000px;"
//   }
//     // | type（commit时的type参数） | Getter（对应的属性） | API（接口地址） | APIDOCs（接口文档地址） |
//   function generateTableComponent(columns,list){
//     return tableRender(h, {
//           columns,
//           tableProps,
//           list
//         })   
//   }
//   function generateLayoutPlugin(plugins = ['search-plugin']) {
//   let pluginDoms = plugins.map(pluginName => data.pluginMap[pluginName].plugin(h,notice))
//   // data.pluginMap.layoutPlugins.map(plugin=>plugin(h,notice))
//   return <div class="more">
//     {pluginDoms}
//   </div>
//   }
//   window.vuexVnode = (
//     <div>
//         {generateLayoutPlugin(['search-plugin'])}
//         {generateTableComponent(data.tableColumnsMap[1],data.targetList)}
//     </div>
//   )
//       return vuexVnode
//     }



import {vuexDebugPannelPlugin} from '../vuex-debug-plugin/index';


export default vuexDebugPannelPlugin;

  