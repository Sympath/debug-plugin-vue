import { callFn, deWeight, eachObj, getApiByService, getStateByType, getVal, mergeArr, nextTick, nextTickForImmediately, nextTickForSetTime, reTry, setActive, tf, typeCheck } from "../util/index";
// import { genInput } from "../../util/eleUtil";

import {
  addPlugin,
  cachePlugin,
  cacheApplyPlugin,
//  dragPlugin,
  moduleHandlerPlugin,
  searchPlugin,
  searchServicePlugin,
} from "../plugins/index";


function genInput(h, cb = () => {}, key,defaultVal) {
  let id = `input${key}`;
  setTimeout(() => {
      var input = document.querySelector(`#${id}`);
      input.addEventListener('input', function(e) {
          //   vuexData.keyWord = e.target.value;
          cb(e.target.value)
      })
    }, 1000);
    return (
      <div vuexData-v-01f94fbc="" class="el-input el-input--small el-input--suffix" style="width: 200px; position: relative;">
           <input value={defaultVal} type="text" autocomplete="off" id={id} placeholder="请输入备注信息" class="el-input__inner"/>
      </div>
    )
}

export let vuexData = {
  firstInited: false, // 初次渲染已完成
  beforeDestroys: [], // 销毁时事件
  targetList: [], // 当前命中列表 用于渲染
  sourceList: [],// 数据源列表 用于缓存
  serviceList: [], // 存储项目service中方法和接口的对应关系
  serviceTargetList: [], // 存储项目service对应的渲染数据列表
  tableColumnsMap: {
    1: [
      {
        label: 'commit时的type参数',
        prop: 'showType',
        width: '200'
      },
      {
        label: 'Getter（对应的属性）',
        prop: 'getter',
        width: '200'
      },
      {
        label: 'Action',
        prop: 'action',
        width: '200'
      },
      {
        label: 'API（接口地址）',
        prop: 'api',
        width: '200'
      },
      {
        label: '备注信息',
        prop: 'annotation',
        width: '250',
        renderCell: (h, {row,column,$index}) => {
          if (typeCheck('Function')(row.annotation)) {
            return row.annotation()
          }
          return genInput(h,(val) => {
            // 在弹窗关闭时会判断 如果此属性为true 则会重置vuex数据缓存
            vuexData.isChangeCache = true;
            row.annotation = val;
        }, `vuexAnnotation${$index}`, row.annotation)
      },
      },
      // {
      //   label: '操作',
      //   prop: 'api',
      //   width: '200',
      //   renderCell: (h, {row,column,$index}) => {
      //     return h('el-link',{
      //       props: {
      //         href: row.apiDocsLink,
      //         // icon: 'el-icon-view',
      //         underline: false
      //       },
      //       attrs: {
      //         target: "_blank"
      //       }
      //     },'查看接口文档')
      //   }
      // },
    ],
    2: [
        {
          label: '模块',
          prop: 'moduleName',
          width: '200'
        },
        {
          label: '方法名',
          prop: 'serviceName',
          width: '200'
        },
        {
          label: 'API（接口地址）',
          prop: 'api',
          width: '200'
        },
        {
          label: '备注信息',
          prop: 'annotation',
          width: '250',
          renderCell: (h, {row,column,$index}) => {
            return genInput(h,(val) => {
              // 在弹窗关闭时会判断 如果此属性为true 则会重置vuex数据缓存
              // vuexData.isChangeCache = true;
              row.annotation = val;
            }, `serviceAnnotation${$index}`, row.annotation)
           }
        },
         {
        label: '操作',
        prop: 'api',
        width: '200',
        renderCell: (h, {row,column,$index}) => {
          return h('el-link',{
            props: {
              href: row.apiDocsLink,
              // icon: 'el-icon-view',
              underline: false
            },
            attrs: {
              target: "_blank"
            }
          },'查看接口文档')
        }
      },
    ]
  },
  Vue: {},
  tableType: 1, // 当前渲染表格的表格类型
  pluginMap: {
    dataPlugins: [], // 数据插件 会在当前渲染列表新增数据时执行
    layoutPlugins: [], // 布局插件，会渲染返回的dom
  } , // 实现插件机制
  options: {}, // ignoreModules  不需要处理模块
}
window.vuexData = vuexData;
// 装载插件 入口函数 main
function importPlugin(Vue,_options){  
  vuexData.options = _options;
  
  eachObj(vuexData.options, (key, val) => {
    Object.defineProperty(vuexData, key, {
      get(){
        return vuexData.options[key]
      },
      set(newVal){
        vuexData.options[key] = newVal;
      }
    })
  })
  vuexData.Vue = Vue;
  // 初始化数据
  initService(vuexData.serviceMap);
  addPlugin('cache-apply-plugin',cacheApplyPlugin)
  addPlugin('module-handler-plugin',moduleHandlerPlugin)
  addPlugin('cache-plugin',cachePlugin)
  addPlugin('search-service-plugin',searchServicePlugin)
  addPlugin('search-plugin',searchPlugin)
  observe();
  // 利用路由守卫 置空当前数据 但不能改变地址值指向 不然会导致observe方法的切片失败导致插件机制失败
  let vuexDebugPluginMixin = {
    beforeRouteLeave(to, from, next){
      // 包裹一层 从而只执行一遍
      nextTickForImmediately(
        function iniLeave() {
          // 置空当前数据 但不能改变地址值指向 不然会导致observe方法的切片失败导致插件机制失败
          vuexData.targetList.length = 0;
        }
      )
      next()
    }
  }
  Vue.mixin(vuexDebugPluginMixin)
}

/**
 * 不需要处理的type
 * @param {*} moduleName type对应的模块
 * @param {*} type type名称
 */
export function noNeedResolve(moduleName, type, module) {
  // let noNeedResolve = false; // 默认需要处理
  // 判断下是不是用户决定不需要处理的模块
  let {ignoreModules = []} = vuexData.options;
  if(ignoreModules.includes(moduleName)){
    return true;
  }
  
  let hased = vuexData.targetList.some(item=>{
    if((item.moduleName === moduleName ) && item.type === type){
        return true 
    } 
  })
//  如果已经有了则不要再存了
  if (hased) {
    return true;
  }
  
  
}

function initService(serviceMap) {
  let vuexPluginServiceData = JSON.parse(localStorage.getItem('vuexPluginServiceData')) || [];
  vuexData.isChangeServiceCache = false;
  // 关闭时校验，如果启动了更新机制，则重置缓存数据
  vuexData.beforeDestroys.push((vuexData)=> {
    if(vuexData.isChangeServiceCache){
      localStorage.setItem('vuexPluginServiceData', JSON.stringify(vuexData.serviceList))
    }
  })
  // // 如果开启缓存的话，则走缓存数据
  if(vuexPluginServiceData.length > 0){
    vuexData.serviceList = vuexPluginServiceData;
    return
  }
  // 没缓存进行解析
  eachObj(serviceMap, (moduleName, moduleServiceObj) => {
    eachObj(moduleServiceObj, (serviceName , serviceFn) => {
      let [ _ , api] = getApiByService(serviceMap[moduleName],serviceName).replace(/\s/g, '').split('|');
      vuexData.serviceList.push({
        serviceName,
        api,
        moduleName
      })
    })
  })
  localStorage.setItem('vuexPluginServiceData', JSON.stringify(vuexData.serviceList))
  
}

function observe() {
  let oldArrayProtoMethods = Array.prototype;
  // 进行一层方法劫持 在新数据增加时进行缓存在localstorage的操作
  vuexData.targetList.push = function (newObj){
    if (!typeCheck('Array')(vuexData.pluginMap.dataPlugins)) {
      console.error(`vuexData.pluginMap.dataPlugins不是数组`);
      vuexData.pluginMap.dataPlugins = []
    }
    let noNeedPlush = false;
    let index = -1;
    dispatch(0)
    function dispatch(i) {
      let fn = null;
      if(i <= index) Promise.resolve(new Error('next() called multiple times'));
      fn = vuexData.pluginMap.dataPlugins[i];
      if(i === vuexData.pluginMap.dataPlugins.length) fn = ()=> {console.log('所有插件执行完毕');return true};
      let pluginReturn = fn(dispatch.bind(null, i + 1), newObj);
      if(pluginReturn){
        noNeedPlush = true;
      }
    }
    // 如果有一个插件决定不push 则不再push
    if(!noNeedPlush){
      let r = oldArrayProtoMethods.push.apply(this,[newObj])
    }
  };
}

export function mapCache(moduleName,type) {
  let cacheItems = vuexData.sourceList.filter(item=>{
    if((item.moduleName === moduleName ) && item.type === type){
        return true 
    } 
  })
//  如果命中缓存 则直接返回缓存数据
  if (cacheItems.length > 0) {
    return cacheItems;
  }
}
export default importPlugin