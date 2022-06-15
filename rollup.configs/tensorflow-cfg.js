import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import alias from '@rollup/plugin-alias';
import replace from 'rollup-plugin-re';

export default [
  {
    input: './rollup.configs/tensorflow-bundle.js',
    output: {
      dir: 'libs',
      format: 'es',
    },
    plugins: [nodePolyfills(), commonjs(), nodeResolve()],
  },
  {
    input: './rollup.configs/bodypix-bundle.js',
    output: {
      dir: 'libs',
      format: 'es',
    },
    plugins: [nodePolyfills(), commonjs(), nodeResolve()],
  },
  {
    input: './rollup.configs/facelandmarks-bundle.js',
    output: {
      dir: 'libs',
      format: 'es',
    },
    plugins: [nodePolyfills(), commonjs(), nodeResolve()],
  },
  {
    input: './rollup.configs/handpose-bundle.js',
    output: {
      dir: 'libs',
      format: 'es',
    },
    plugins: [nodePolyfills(), commonjs(), nodeResolve()],
  },
  /* {
    input: './rollup.configs/mediapipepose-bundle.js',
    output: {
      dir: 'libs',
      format: 'es',
    },
    context: 'window',
    plugins: [
      nodePolyfills(),
      nodeResolve(),
    ],
  }, */
  {
    input: './rollup.configs/posedetection-bundle.js',
    output: {
      dir: 'libs',
      format: 'es',
    },
    plugins: [
      alias({
        entries: [
          {
            find: '@mediapipe/pose',
            replacement: './libs/mediapipepose-bundle.js',
          },
        ],
      }),
      nodePolyfills(),
      commonjs(),
      nodeResolve(),
      replace({
        /* not a fan of this blunt replacement, but I dind't know how to solve this */
        patterns: [
          {
            test: 'pose.Pose',
            replace: 'window.Pose',
          }
        ]
      }),
    ],
  },
];
