export function genDropDown(h, items, cb) {
    let dropdownItems = items.map((item, index) => {
       return h(
           'el-dropdown-item',
           {
               props: {
                command: index
               }
           },
           [item]
       )
    })

    return h('el-dropdown', {
        on: {
            handleCommand(index){
                cb(items[index], index);
            }
        },
        class: 'more'
    },[
        h('span',{class:"el-dropdown-link"}, ['功能项', h('i', {
            class: 'el-icon-arrow-down el-icon--right'
        })]),  
        h(
        'el-dropdown-item',{
            props: {
                slot: 'dropdown'
            }},
        dropdownItems
      )])
}