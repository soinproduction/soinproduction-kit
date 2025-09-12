import copy from 'rollup-plugin-copy';

export default {
    input: 'index.js',
    output: {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true
    },
    plugins: [
        copy({
            targets: [
                { src: 'src/**/*.{css,scss,md,js,html}', dest: 'dist/src' }
            ],
            flatten: false
        })
    ]
}
