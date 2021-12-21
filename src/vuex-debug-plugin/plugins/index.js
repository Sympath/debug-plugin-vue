import { vuexData } from "../libs/import";
import { typeCheck } from "../util/index";
import cachePlugin from "./cachePlugin";
import cacheApplyPlugin from "./cacheServicePlugin";
// import dragPlugin from "./dragPlugin";
import moduleHandlerPlugin from "./moduleHandlerPlugin";
import searchPlugin from "./searchPlugin";
import searchServicePlugin from "./searchServicePlugin";
/**
 * 插件机制
 * @param {*} pluginWrap 插件默认为一个返回函数的函数 外层函数会默认执行 并在执行时被传递vuexData；
 */
function addPlugin(pluginName,pluginWrap =() => {}) {
    // console.log(1,pluginName, pluginWrap);
    if (typeCheck('Function')(pluginWrap)) {
      // console.log(2,  pluginWrap);
      let plugin = pluginWrap(vuexData);
      if (typeCheck('Function')(plugin)) {
        // console.log(3, plugin);
        vuexData.pluginMap.dataPlugins.push(plugin);
        // 记录插件名称
        vuexData.pluginMap[pluginName] = {
          type: 0,
          plugin
        }
      }else if (typeCheck('Object')(plugin) && plugin.type === '1') {
        // console.log(4, plugin);
        if (typeCheck('Function')(plugin.handler)) {
          vuexData.pluginMap.layoutPlugins.push(plugin.handler)
          vuexData.pluginMap[pluginName] = {
            type: 1,
            plugin: plugin.handler
          }
        }
     
      }else {
        console.error('未支持的插件类型');
      }
      // console.log(5, vuexData.pluginMap);
    }
}
  
export {
    addPlugin,
    cachePlugin,
    cacheApplyPlugin,
//  dragPlugin,
    moduleHandlerPlugin,
    searchPlugin,
    searchServicePlugin,
}