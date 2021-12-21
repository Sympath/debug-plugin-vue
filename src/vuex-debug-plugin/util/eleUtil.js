export function genInput(h, cb = () => {}, key,defaultVal) {
    let id = `input${key}`;
    setTimeout(() => {
        var input = document.querySelector(`#${id}`);
        input.addEventListener('input', function(e) {
            //   vuexData.keyWord = e.target.value;
            cb(e.target.value)
        })
      }, 1000);
      return (
        <div vuexData-v-01f94fbc="" class="el-input el-input--small el-input--suffix" style="width: 200px; position: relative;">
             <input value={defaultVal} type="text" autocomplete="off" id={id} placeholder="请输入备注信息" class="el-input__inner"/>
        </div>
      )
}