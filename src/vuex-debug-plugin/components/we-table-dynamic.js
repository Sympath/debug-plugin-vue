function tableRender(h, props = {}) {
  let {
    loading = false,
    tableProps = {},
    list = [],
    columns = [],
    events = {}
  } = props;
  const render = (h, vuexData) => {
    vuexData = Array.isArray(vuexData) ? vuexData : [vuexData]
    return vuexData.map(col => {
      const { children } = col
      const props = {
        ...col
      }
      // 特殊处理
      const hasChildren = Array.isArray(children) && children.length;
      const hasCellRender = typeof col.renderCell === 'function';
      let cS = []
      if (hasChildren) {
        cS = render(h, children)
      }
      const colProps = {
        props
      }
      if (hasCellRender) {
        colProps.scopedSlots = {
          default(ps) {
            let renderTarget = col.renderCell(h, ps);
            return renderTarget // 通过renderCell，支持scopedSlots
           
          }
        }
      }
      return h('el-table-column', colProps, hasChildren ? cS : []) // 通过children属性，支持多级表头
    })
  }
  return h('el-table', {
    class: 'config-table',
    props: {
      ...tableProps,
      data:list
    },
    on: {
      ...events // 支持El-Table 原有所有Events
    },
    directives: [
      {
        name: 'loading',
        value: loading // 支持loading
      }
    ],
    ref: 'ref', // 通过这个ref，对应El-Table Methods
  }, render(h, columns)) // 支持El-Table slot append
}

export default tableRender;