function cascaderRender(h, inputProps = {}) {
    let {
        props,
        renderSlots,
        ...outProps
    } = inputProps;
    let cascaderProps = {
        props:{
            ...outProps,
            props
        }
    }
    const hasSlotsRender = typeof renderSlots === 'function';
    if (hasSlotsRender) {
        cascaderProps.scopedSlots = {
            default:(props) => {
                return <span>身体</span>
              }
        }
      }
    
    return h('el-cascader', {
        ...cascaderProps,
        ...{
          scopedSlots: {
            default:(props) => {
              return <span>身体</span>
            },
            title:(props)=>{
              return <span>头</span>
            }
          }
        }
    },[]) // 支持El-cascader slot append
  }
  
  export default cascaderRender;