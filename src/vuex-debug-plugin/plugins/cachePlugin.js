// 实现插件从而实现缓存机制
export default function cachePlugin(vuexData) {
    // 先看有没有缓存
    let localStorageDatas = getStoreVuexPluginData();
    vuexData.sourceList.push(...localStorageDatas);
    vuexData.isChangeCache = false;
    vuexData.beforeDestroys.push((vuexData) => {
      if(vuexData.isChangeCache){
        setStoreVuexPluginData(vuexData.sourceList)
      }
    })
    return function (next,newObj) {
      // 加上缓存标识
      if(newObj.isCache){

      }else {
        newObj.isCache = true;
        // 存入缓存对象中
        vuexData.sourceList.push(newObj)
        setStoreVuexPluginData(vuexData.sourceList)
      }
    }
}

export function setStoreVuexPluginData(datas = []) {
    localStorage.setItem('vuexPluginData',JSON.stringify(datas));
  }
  export function getStoreVuexPluginData() {
    return JSON.parse(localStorage.getItem('vuexPluginData')) || [];
  }
  