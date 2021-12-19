import { typeCheck } from "../../util";

function textAreaRender(h,props) {
    let {
        row,
        placeholder,
        id,
        change
    } = props
    let textAreaDom;
    let keyWord = ''
    Object.defineProperty(props, 'keyWord', {
      get(){
        return keyWord
      },
      set(newVal){
        keyWord = newVal
        textAreaDom.value = newVal
      }
    })
    setTimeout(() => {
        textAreaDom = document.querySelector(`#search-area${id}`);
        textAreaDom.addEventListener('input', function(e) {
            props.keyWord = e.target.value;
            if (typeCheck('Function')(change)) {
              change(e.target.value)
            }
        })
      }, 1000);
      return (
        <div data-v-e2e56c92="" class="el-textarea">
          <textarea id={`search-area${id}`} autocomplete="off" rows={row} placeholder={placeholder} class="el-textarea__inner" style="min-height: 33px;">
          </textarea>
        </div>
      )
}
export default textAreaRender