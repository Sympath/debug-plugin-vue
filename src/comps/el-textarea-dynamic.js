function textAreaRender(h,props) {
    let {
        row,
        placeholder,
        id
    } = props
    setTimeout(() => {
        var textArea = document.querySelector(`#search-area${id}`);
        textArea.addEventListener('input', function(e) {
            props.keyWord = e.target.value;
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