import { eachObj, mergeArr } from "../util/index";
import inputRender from "../../comps/el-input-dynamic";
import { typeCheck } from "../../../util/index";

export default function searchPlugin(vuexData) {
    function filterListByKeyWord( keyword = 'all' , keywordType) {
      return vuexData.sourceList.filter(source => {
        let {
          type,
          getter,
          action,
          api,
          annotation
        } = source;
        let isChoosed = false;
        eachObj({
          type,
          getter,
          type,
          action,
          api,
          annotation
        }, (key , val) => {
          if (keyword === 'all') {
            isChoosed = true;
          }
          if((val).startsWith(keyword)){
            isChoosed = true;
          }
        })
        return isChoosed; 
      })
      
    }
    return {
      type: '1',
      key: 'vuex-search',
      handler: (h, notice) => {
        let searchHandler = (filterText)=>{
          // if (filterText === '') {
          //   notice('关键词不能为空');
          //   return;
          // }
          let filterList = filterListByKeyWord( filterText);
          if(filterList.length > 0){
            vuexData.targetList.length = 0;
            mergeArr(vuexData.targetList, filterList)
            // if (typeCheck('Function')(vuexData.render)) {
            //   // vuexData.render()
            // }else {
            //   console.log('获取重绘函数失败');
            // }
            notice('搜索成功');
          }else {
            notice('搜索结果为空');
          }
        }
        let searchProps = {
          id: 4,
          // label: '过滤搜索',
          placeholder:'请输入getter/type/action/api',
          icon:{
              clickHandler:searchHandler,
              type: 'search'
          }
      }
        return (
          
          inputRender(h,searchProps)
        )
      }
    }
  }