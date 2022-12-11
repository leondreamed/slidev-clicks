import { join } from 'desm'
import { chProjectDir, copyPackageFiles, rmDist, tsc } from 'lionconfig'
import replace from 'replace-in-file'

chProjectDir(import.meta.url)
rmDist()
await tsc()
await copyPackageFiles()
await replace.replaceInFile({
	files: join(import.meta.url, '../dist/utils/clicks.js'),
	from: '@slidev/client/constants?ts-ignore',
	to: '@slidev/client/constants',
})
