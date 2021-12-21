export default function moduleHandlerPlugin(vuexData) {
    vuexData.dictionaryMap = {
      showType: '字典模块 | dictionary',
      type: '',
      moduleName: 'dictionary',
      getter: '',
      action: 'actionMultiDictionary',
      api: 'apiFetchMultiDictionary | /common/dict/items/multi-code',
      index: 0,
      annotation: ''
    };
    vuexData.targetList.push(vuexData.dictionaryMap)
    return (next,newObj)=>{
      let noPush = false;
      let {moduleName, type } = newObj;
      // 字典模块特殊处理
      if (moduleName === 'dictionary') {
        // 如果target
        // if(vuexData.targetList.every(item.showType !== 'showType')){
        //   vuexData.targetList.push(vuexData.dictionaryMap)
        // }
        // vuexData.dictionaryMap.type += `${vuexData.dictionaryMap.index} ${type};`
        // vuexData.dictionaryMap.annotation = `触发字典为：${vuexData.dictionaryMap.type}`
        // vuexData.dictionaryMap.index++;
        // let states = getStateByType(type,module);
        // vuexData.dictionaryMap.getter += `${vuexData.dictionaryMap.index} ${states.join(',')};`
        noPush = true;
      }else {
        next()
      }
      return noPush
      
    }
  }
  