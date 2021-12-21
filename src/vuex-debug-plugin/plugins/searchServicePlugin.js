import { eachObj, mergeArr } from "../util/index";

export default function searchServicePlugin(vuexData) {
    vuexData.serviceKeyWord = '';
    function filterListByKeyWord( keyword = 'all' , keywordType) {
      return vuexData.serviceList.filter(source => {
        let {
          serviceName,
          api,
          moduleName
        } = source;
        let isChoosed = false;
        eachObj({
          serviceName,
          api
        }, (key , val) => {
          if (keyword === 'all') {
            isChoosed = true;
          }
          if((val || '').indexOf(keyword) > -1){
            isChoosed = true;
          }
        })
        return isChoosed; 
      })
      
    }
    return {
      type: '1',
      key: 'service-search',
      handler: (h, notice) => {
        setTimeout(() => {
          var input = document.querySelector('#serviceSearch');
          input.addEventListener('input', function(e) {
            vuexData.serviceKeyWord = e.target.value;
          })
        }, 1000);
        return (
          <div vuexData-v-01f94fbc="" class="el-input el-input--small el-input--suffix" style="width: 200px; position: relative;margin-left: 70px;">
              <span style="position: absolute; left: -55px;top: 50%;transform: translateY(-50%);">service：</span><input type="text" autocomplete="off" id="serviceSearch" placeholder="请输入serviceName/api" class="el-input__inner"/>
              <span class="el-input__suffix">
                  <span class="el-input__suffix-inner">
                      <i
                        onClick={
                          ()=>{
                            // if (vuexData.serviceKeyWord === '') {
                            //   notice('关键词不能为空');
                            //   return;
                            // }
                            let filterList = filterListByKeyWord( vuexData.serviceKeyWord);
                            if(filterList.length > 0){
                              vuexData.serviceTargetList.length = 0;
                              vuexData.tableType = 2;
                              mergeArr(vuexData.serviceTargetList, filterList)
                              notice('搜索成功');
                            }else {
                              notice('搜索结果为空');
                            }
                          }
                        }  
                        vuexData-v-01f94fbc="" class="el-icon-search el-input__icon"></i>
                  </span>
              </span>
          </div>
        )
      }
    }
  }