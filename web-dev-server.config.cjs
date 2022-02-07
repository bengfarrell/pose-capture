const range = require('koa-range');
const fromRollup = require('@web/dev-server-rollup').fromRollup;
const Alias = require('@rollup/plugin-alias');
const pluginAlias = fromRollup(Alias);

const projectRootDir = process.cwd();

module.exports = {
    port: 8080,
    watch: true,
    nodeResolve: true,
    http2: true,
    preserveSymlinks: true,
    middlewares: [ range ],
    plugins: [
        pluginAlias({
            entries: [
                {
                    find: '@mediapipe/pose',
                    replacement: `${projectRootDir}/libs/mediapipepose-bundle.js`,
                },
            ],
        }),
    ],
};
