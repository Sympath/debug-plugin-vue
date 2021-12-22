import { eachObj, nextTickFoDelay } from "../../util/index";
import { $mount, creatDom, mountToBody, remove_items } from "../libs/dom";

/**
 * 渲染el-input组件 2.1.3 elementUI 的Input组件通过JSX渲染存在问题 会无法输入值 所以自己实现了下
 * @param {*} h 
 * @param {*} props 
 *      keyWord  *（代表必传）v-model绑定值
 *      id,  *（代表必传）  用于绑定input事件  
        icon 对象  
            type 传递图标名 如果不传则不出现icon
            clickHandler icon点击事件处理函数 会传递当前input内容
        label, 
        placeholder
 * @returns 
 */
function autocompleteRender(h,props) {
    let renderData = {
      suggests: [] // 建议列表
    }
    
    let showSuggest = false;
    Object.defineProperty(renderData, 'showSuggest', {
        get(){
          return showSuggest
        },
        set(newVal){
          showSuggest = newVal;
          suggestRender()
        }
    })
    function suggestRender(){
      let suggestRender = ()=>{
        if (renderData.showSuggest) {
          remove_items('#el-autocomplete',{
            removeSelf: true
          })
           // 点击当前元素处理操作
          let liVnode = renderData.suggests.length> 0 ? renderData.suggests.map(
            d => (<li
            onClick={() => {
              props.keyWord = d.label;
              inputDom.value = d.label;
              renderData.showSuggest = false;
              if (iconEmit) {
                icon.clickHandler(props.keyWord)
              }
            }}
            id="el-autocomplete-3571-item-0" role="option" class="">
            {d.label}
          </li>)
          ): <li>暂无属性</li>
          let sugestVnode = (<div 
            id="el-autocomplete" 
            role="region" class="el-autocomplete-suggestion el-popper" style="position: absolute; top: 40px;  transform-origin: center top; z-index: 2004; width: 178px;" x-placement="bottom-start"><div class="el-scrollbar"><div class="el-autocomplete-suggestion__wrap el-scrollbar__wrap el-scrollbar__wrap--hidden-default">
            <ul class="el-scrollbar__view el-autocomplete-suggestion__list" role="listbox" id="el-autocomplete-1108">
              {liVnode}
            </ul>
          </div><div class="el-scrollbar__bar is-horizontal"><div class="el-scrollbar__thumb" style="transform: translateX(0%);"></div></div><div class="el-scrollbar__bar is-vertical"><div class="el-scrollbar__thumb" style="transform: translateY(0%);"></div></div></div><div x-arrow="" class="popper__arrow" style="left: 35px;"></div></div>)
          $mount(inputDom.parentNode,creatDom(sugestVnode))
        }else {
          remove_items('#el-autocomplete',{
            removeSelf: true
          })
        }
      }
      nextTickFoDelay(suggestRender)
    }
    
    let {
        id = Math.random(),
        icon,
        iconEmit, // 点击建议框后同时触发icon事件
        label,
        placeholder,
        querySearch
    } = props;
    let iconType;
    let iconClickHandler;
    let inputDom;
    let keyWord = ''
    Object.defineProperty(props, 'keyWord', {
      get(){
        return keyWord
      },
      set(newVal){
        keyWord = newVal
        inputDom.value = newVal
      }
    })
    if (icon) {
      iconType = icon.type;
      iconClickHandler = icon.clickHandler;
    }

    
    let handleFilterData = (result) => {
      renderData.suggests = result;
      renderData.showSuggest = true;
    }
    
    setTimeout(() => {
        inputDom = document.querySelector(`#autocomplete${id}`);
        inputDom.addEventListener('input', function(e) {
            props.keyWord = e.target.value;
            let querySearchWrap = ()=>{
              querySearch(props.keyWord, handleFilterData)
            }
            // 防抖 避免多次渲染dom
            nextTickFoDelay(querySearchWrap, 100)
        })
      }, 1000);
      return (
        <div data-v-e2e56c92="" aria-haspopup="listbox" role="combobox" aria-owns="el-autocomplete-1108" 
        
        class="el-autocomplete inline-input" aria-expanded="true"><div class="el-input">
          <input onClick={()=>{
              console.log(111);
              querySearch('ALL', handleFilterData)
            }} 
            onBlur={() => {
              // 失去焦点时判断点击区域是否在suggest区域，不在则关闭suggest浮窗
              document.querySelector('.vm-msgbox').addEventListener('click', function(e){
                //  || e.target.closest(`#autocomplete${id}`)
                    if(e.target.closest("#el-autocomplete")|| e.target.closest(`#autocomplete${id}`)) 
                      {
                      } else {
                        console.log(222);

                        //点击非当前元素，需要执行的代码
                        renderData.showSuggest = false;
                      }
                    }, {passive: true}
                  )
              let closeSuggest = ()=>{
                renderData.showSuggest = false;
              }
              // nextTickFoDelay(closeSuggest)
            }}
            value={props.keyWord} id={`autocomplete${id}`} 
            type="text" autocomplete="off" valuekey="value" placeholder={placeholder ?`${placeholder}` : '请输入内容'} debounce="300" placement="bottom-start" popperappendtobody="true" class="el-input__inner" role="textbox" aria-autocomplete="list" aria-controls="id" aria-activedescendant="el-autocomplete-1108-item--1"/>
          {iconType ? <span class="el-input__suffix">
                <span class="el-input__suffix-inner">
                    <i
                      onClick={
                        ()=>{iconClickHandler(props.keyWord)}
                      }  
                      data-v-01f94fbc="" class={`el-icon-${iconType} el-input__icon`}></i>
                </span>
            </span>: ''}
          </div></div>
      )
}
export default autocompleteRender