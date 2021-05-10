import babel from 'rollup-plugin-babel'
import {uglify} from 'rollup-plugin-uglify';

export default {
    input:'./main.js',
    output:{
        format:'commonjs', // 支持amd 和 commonjs规范 window.Vue
        name:'pluginWrapper',
        file:'dist/bundle.js',
        sourcemap:false, // es5 -> es6源代码
        minify: true // 代码是否压缩
    },
    plugins:[
        babel({ // 使用babel进行转化 但是拍出node_modules 文件
            exclude:'node_modules/**', // glob 语法
        }),
        // uglify({
        //     compress: {
        //       pure_getters: true,
        //       unsafe: true,
        //       unsafe_comps: true,
        //     }
        //   })
    ]
}
