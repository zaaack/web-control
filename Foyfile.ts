import { fs, setGlobalOptions, task } from 'foy'

setGlobalOptions({ loading: false })

task('build', async ctx => {
  await fs.rmrf('./dist')
  await fs.rmrf('./build')
  await ctx.exec(`ncc build ./src/index.ts -t --no-asset-builds -o ./dist`)
  let ret = await ctx.exec('node -v', { stdio: 'pipe' })
  let nodeVer = ret.stdout.split('.')[0].split('v')[1]
  await ctx.exec(`pkg -t node${nodeVer}-${{darwin: 'macos', win32: 'win', linux: 'linux'}[process.platform]}-x64 -o ./build/${require('./package.json').name}-${process.platform} . `)
})
