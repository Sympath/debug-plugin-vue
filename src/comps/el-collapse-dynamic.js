function collapseRender(h, props = {}) {

  return h('el-collapse',{}, [
    <el-collapse-item {
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
    }/>
  ])
 
}

export default collapseRender;