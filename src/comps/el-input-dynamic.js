function inputRender(h,props) {
    let {
        label,
        placeholder
    } = props
    setTimeout(() => {
        var input = document.querySelector('#search');
        input.addEventListener('input', function(e) {
            props.keyWord = e.target.value;
        })
      }, 1000);
      return (
        <div data-v-01f94fbc="" class="el-input el-input--small el-input--suffix" style="width: 200px; position: relative;margin-left: 70px;">
           <span style="position: absolute; left: -55px;top: 50%;transform: translateY(-50%);">{label }</span> <input type="text" autocomplete="off" id="search" placeholder={placeholder} class="el-input__inner"/>
            <span class="el-input__suffix">
                <span class="el-input__suffix-inner">
                    <i
                      onClick={
                        ()=>{props.eventHandler(props.keyWord)}
                      }  
                      data-v-01f94fbc="" class="el-icon-search el-input__icon"></i>
                </span>
            </span>
        </div>
      )
}
export default inputRender