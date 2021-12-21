let h; // 保存createElement函数
const componentObj = {
    input: generateInputComponent,
    button: generateButtonComponent,
    buttonGroup: generateButtonGroupComponent,
    reset: generateResetComponent,
    submit: generateSubmitComponent,
    icon: generateIconComponent,
    radio: generateRadioComponent,
    radioGroup: generateRadioGroupComponent,
    checkbox: generateCheckboxComponent,
    checkboxGroup: generateCheckboxGroupComponent,
    switch: generateSwitchComponent,
    select: generateSelectComponent,
    slider: generateSliderComponent,
    date: generateDateComponent,
    time: generateTimeComponent,
    cascader: generateCascaderComponent,
    inputNumber: generateInputNumberComponent,
    rate: generateRateComponent,
    upload: generateUploadComponent,
    colorPicker: generateColorPickerComponent,
    col: generateColComponent,
    form: generateForm
}


function handleFormItemComponents(children,formData) {
    function _generateFormItemComponent(opt, childrenComp) {
        let {props = {},key = '', style = {},className = ''} = opt;
        return h('el-form-item', {
            class: className,
            style,
            props: {
                prop: key? key : '',
                ...props
            }
        }, [childrenComp])
    }
    if (children) {
        children = children.map(item => {
            let {formItemProps = {},type = '',key = ''} = item;
            let component
            if (item.type == 'span') {
                component = h('span', {
                    slot: item.slot
                }, [item.text])
            } else {
                let func = componentObj[type]
                component = func? func(item, formData) : null
            }

            return _generateFormItemComponent({...formItemProps,key},component)
        })
        return children
    }
    return []

}

function generateForm(opt, formData = {},vm = {}) {
    let {key,props = {}, style = {} ,className = '', children = []} = opt;
    children = handleFormItemComponents(children,formData);
    return h('el-form', {
        ref: 'form',
        class: 'gen-form '+className,
        style,
        props: {
            model: formData,
            ...props
        }
    }, children)
}

function generateInputComponent(opt, formData = {},vm = {}) {
    let {key,props = {}, style = {} , events = [],children = []} = opt;
    children = handleChildren(children,formData);

    return h('el-input', {
        props: {
            value: key? formData[key] : '',
            ...props
        },
        style,
        on: {
            ...translateEvents(events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        },
    }, children)
}
function generateSwitchComponent(opt, formData = {},vm = {}){
    let {key,props = {}, style = {} , events = [],slot = ''} = opt;
    // 监听 onChange 事件进行赋值操作
    function _handleChange(e) {
        formData[key] = e;
    }
    _handleChange = _handleChange.bind(this);
    return h('el-switch', {
        props: {
            value: key? formData[key] : '',
            ...props
        },
        style,
        on: {
            ...translateEvents(events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        },
        slot
    })
    
    
    // <el-switch value={formData[opt.key]} onInput={_handleChange} style={ opt.style || {} }></el-switch>
}

function generateSelectComponent(opt, formData = {},vm = {}){
    let {key,props = {}, style = {} , events = []} = opt;
    // 监听 onInput 事件进行赋值操作
    function _handleInput(e) {
        formData[key] = e;
    }
    _handleInput = _handleInput.bind(this);
    return h('el-select', {
        props: {
            value: key? formData[key] : '',
            ...props
        },
        style,
        on: {
            ...translateEvents(events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    },_generateList(opt))
    return <el-select value={formData[opt.key]} onInput={_handleInput} style={ opt.style || {} }>{_generateList(opt)}</el-select>
}
function _generateList (itemObj) {
        let itemEle = []
        for (let index = 0; index < itemObj.value.length; index++) {
            const item = itemObj.value[index]
            switch (itemObj.type) {
            // 下拉菜单
            case 'select':
                itemEle.push(<el-option key={ item.key } label={ item.text } value={ item.key }></el-option>)
                break
            // 多选框
            case 'checkbox':
                itemEle.push(<el-checkbox label={ item.index }>{ item.text }</el-checkbox>)
                break
            // 单选框
            case 'radio':
                itemEle.push(<el-radio label={ item.index }>{ item.text }</el-radio>)
                break
            }
        }
        return itemEle
}
function generateButtonComponent(opt, formData = {}, vm) {
    let {text,props = {}, style = {} , events = [],slot = ''} = opt;
    return h('el-button', {
        props,
        slot,
        style,
        on:events,
    }, [text])
}

function generateButtonGroupComponent(opt, formData = {}, vm) {
    let {text,props = {}, style = {} , events = [],slot = ''} = opt;
    const components = obj.children.map(item => {
        return h('Button', {
            props: item.props? item.props : item,
            slot: item.slot,
            style: item.style,
            on: item.events
        }, [item.text])
    })

    return h('ButtonGroup', {
        props: obj.props,
        style: obj.style,
        slot: obj.slot,
    }, [components])
}

function generateRadioComponent(h, opt, formData = {}, vm) {
       
    let {key,props = {}, style = {} , events = [],children = [],slot} = opt;
    return h('el-radio', {
        props: {
            value: key? formData[key] : false,
            ...props
        },
        style,
        slot,
        on: {
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    },children)
  }

function generateRadioGroupComponent(h, opt, formData = {}, vm) {
    let {key,props = {}, style = {} , events = [],children = []} = opt;
    let components = []
    if (children) {
        components = children.map(child => {
            return h('el-radio', {
                props: child.props? child.props : child
            }, [child.text])
        })
    }

    return h('el-radio-group', {
        props: {
            value: key? formData[key] : '',
            ...props
        },
        style: style,
        slot: slot,
        on: {
            ...translateEvents(events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    }, [components])
}

// h, opt, formData = {}
function genFormItem(type,_h){
    h = _h    
    return componentObj[type];
}

function translateEvents(events = {}, vm) {
    const result = {}
    for (let event in events) {
        result[event] = events[event].bind(vm)
    }

    return result
}
function handleChildren(children,formData){
    if (children) {
        children = children.map(item => {
            let component
            if (item.type == 'span') {
                component = h('span', {
                    slot: item.slot
                }, [item.text])
            } else {
                let func = componentObj[item.type]
                component = func? func(item, formData) : null
            }
            return component
        })
        return children
    }
    return []
}




export default genFormItem





// ==================================





function generateSubmitComponent(h, opt, formData = {}, vm) {
    const components = []
    const submit = h('Button', {
        props: obj.props,
        style: obj.style,
        on: {
            click() {
                vm.$refs['form'].validate((valid) => {
                    if (valid) {
                        obj.success.call(vm, formData)
                    } else {
                        obj.fail.call(vm, formData)
                    }
                })
            }
        }
    }, [obj.text])

    components.push(submit)

    if (obj.reset) {
        const reset = h('Button', {
            props: obj.reset.props,
            style: {
                marginLeft: '10px',
                ...obj.style,
            },
            on: {
                click() {
                    vm.$refs['form'].resetFields()
                }
            }
        }, [obj.reset.text])

        components.push(reset)
    }

    return h('div', components)
}

function generateResetComponent(h, opt, formData = {}, vm) {
    return h('Button', {
        props: obj.props,
        style: obj.style,
        slot: obj.slot,
        on: {
            click() {
                vm.$refs['form'].resetFields()
            }
        }
    }, [obj.text])
}

function generateIconComponent(h, opt, formData = {}, vm) {
    return h('Icon', {
        props: obj.props,
        style: obj.style,
        slot: obj.slot,
    })
}

function generateRadioComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('Radio', {
        props: {
            value: key? formData[key] : false,
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    }, [obj.text])
}





function generateCheckboxComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('Checkbox', {
        props: {
            value: key? formData[key] : '',
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    }, [obj.text])

}

function generateCheckboxGroupComponent(h, opt, formData = {}, vm) {
    let components = []
    const key = obj.key? obj.key : ''

    if (obj.children) {
        components = obj.children.map(child => {
            return h('Checkbox', {
                props: child.props? child.props : child
            }, [child.text])
        })
    }

    return h('CheckboxGroup', {
        props: {
            value: key? formData[key] : [],
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    }, [components])
}


function generateSliderComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('Slider', {
        props: {
            value: formData[key],
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    })
}


function generateDateComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''
    const type = obj.props.type
    return h('DatePicker', {
        props: {
            value: key? formData[key] : '',
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(date) {
                if (key) {
                    if (type.includes('datetime')) {
                        if (Array.isArray(date)) {
                            formData[key] = date? date.map(item => item? item.toLocaleDateString() 
                                                  + ' ' + item.toTimeString().split(' ')[0] : '') : []
                        } else {
                            formData[key] = date? date.toLocaleDateString() + ' ' + date.toTimeString().split(' ')[0] : ''
                        }
                    } else {
                        if (Array.isArray(date)) {
                            formData[key] = date? date.map(item => item? item.toLocaleDateString() : '') : []
                        } else {
                            formData[key] = date? date.toLocaleDateString() : ''
                        }
                    }
                }
            },
        }
    })
}

function generateTimeComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('TimePicker', {
        props: {
            value: key? formData[key] : '',
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    })
}

function generateCascaderComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''
    
    return h('Cascader', {
        props: {
            value: key? formData[key] : [],
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    })
}

function generateInputNumberComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('InputNumber', {
        props: {
            value: key? formData[key] : null,
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    })
}

function generateRateComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('Rate', {
        props: {
            value: key? formData[key] : 0,
            ...obj.props
        },
        slot: obj.slot,
        style: obj.style,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    })
}

function generateUploadComponent(h, opt, formData = {}, vm) {
    let components = []

    if (obj.children) {
        components = obj.children.map(item => {
            let func = componentObj[item.type]
            return func? func.call(vm, h, formData, item, vm) : null
        })
    }
    return h('Upload', {
        props: obj.props,
        style: obj.style,
        slot: obj.slot,
    }, components)
}

function generateColorPickerComponent(h, opt, formData = {}, vm) {
    const key = obj.key? obj.key : ''

    return h('ColorPicker', {
        props: {
            value: key? formData[key] : '',
            ...obj.props
        },
        style: obj.style,
        slot: obj.slot,
        on: {
            ...translateEvents(obj.events, vm),
            input(val) {
                if (key) {
                    formData[key] = val
                }
            }
        }
    })
}

function generateColComponent(h, obj, component) {
    return h('Col', {
        props: {
            span: obj.span,
            push: obj.push,
            pull: obj.pull,
            offset: obj.offset,
            order: obj.order,
            'class-name': obj['class-name'] || obj['className'],
            xs: obj.xs,
            sm: obj.sm,
            md: obj.md,
            lg: obj.lg,
        },
    }, [component])
}





