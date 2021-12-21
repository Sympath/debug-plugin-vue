/**
 * 默认v-model keyWord
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
function inputRender(h,props) {
    let {
        id = Math.random(),
        icon,
        label,
        placeholder
    } = props;
    let iconType;
    let iconClickHandler;
    let inputDom;
    if (icon) {
      iconType = icon.type;
      iconClickHandler = icon.clickHandler;
    }
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
    setTimeout(() => {
        inputDom = document.querySelector(`#search${id}`);
        inputDom.addEventListener('input', function(e) {
          console.log(111, e.target.value);
            props.keyWord = e.target.value;
        })
      }, 1000);
      return (
        <div data-v-01f94fbc="" class="el-input el-input--small el-input--suffix" style="width: 200px; position: relative;margin-left: 70px;">
           {label? <span style="position: absolute; left: -65px;top: 50%;transform: translateY(-50%);">{label}</span> : "" }<input type="text" autocomplete="off" id={`search${id}`} placeholder={placeholder} class="el-input__inner"/>
           {iconType ? <span class="el-input__suffix">
                <span class="el-input__suffix-inner">
                    <i
                      onClick={
                        ()=>{
                          iconClickHandler(props.keyWord)
                        }
                      }  
                      data-v-01f94fbc="" class={`el-icon-${iconType} el-input__icon`}></i>
                </span>
            </span>: ''}
        </div>
      )
}
export default inputRender