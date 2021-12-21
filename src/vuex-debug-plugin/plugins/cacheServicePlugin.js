import { eachObj, mergeArr } from "../util/index";
let timeId = '';
export default function cacheApplyPlugin(vuexData) {
    vuexData.applyCache = false;
    return {
      type: '1',
      handler: (h, notice) => {
        clearTimeout(timeId);
        timeId = setTimeout(() => {
          var switchDom = document.querySelector('#cache');
          switchDom.addEventListener('click', function(e) {
            let oldStatus = vuexData.isChangeServiceCache
            let newStatus = !oldStatus;
            vuexData.isChangeServiceCache = newStatus;
            let noticeInfo = '';
            if(newStatus){
              switchDom.classList.add('is-checked')
              noticeInfo = '启用缓存';
            }else {
              switchDom.classList.remove('is-checked')
              noticeInfo = '禁用缓存';
            }
            notice(noticeInfo)
          })
        }, 1000);
        return (
          <div vuexData-v-01f94fbc="" id="cache" role="switch" class="el-switch el-switch--center el-switch--small">
            <input type="checkbox" name="" true-value="true" class="el-switch__input"/>
            <span class="el-switch__label el-switch__label--left"><span aria-hidden="true">是否启用缓存：</span></span>
            <span class="el-switch__core" style="width: 40px;"></span>
          </div>
         
        )
      }
    }
  }


