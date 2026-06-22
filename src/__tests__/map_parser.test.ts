import * as zip from '@zip.js/zip.js'
import { MapParser, partitionNameFromMapEntry } from '@/services/map_parser'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, expect, test } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let targetFile = new Blob()
let mapParser: MapParser
let flashPackageParser: MapParser

const systemMap = [
  '//system/apex/com.android.test1.apex',
  '//system/apex/com.android.test2.apex',
  '//system/apex/com.android.test2.apex',
  '//system/apex/com.android.test2.apex',
  '//system/apex/com.android.test3.apk',
  '//system/apex/com.android.test1.apex',
  '//system/apex/com.android.test1.apex',
  '//system/apex/com.android.test1.apex',
  '//system/apex/com.android.test1.apex',
  '<system_test>',
  '//init.environ.rc'
]

beforeAll(async () => {
  zip.configure({ useWebWorkers: false })

  const file = path.join(__dirname, 'system_test.map')
  const text = fs.readFileSync(file, 'utf-8')
  const blobWriter = new zip.BlobWriter('application/zip')
  const writer = new zip.ZipWriter(blobWriter)
  await writer.add('IMAGES/system_test.map', new zip.TextReader(text))
  await writer.close()
  targetFile = await blobWriter.getData()
  mapParser = new MapParser(new File([targetFile], 'system_test.zip'))
  await mapParser.init()

  const flashBlobWriter = new zip.BlobWriter('application/zip')
  const flashWriter = new zip.ZipWriter(flashBlobWriter)
  await flashWriter.add('system_test.map', new zip.TextReader(text))
  await flashWriter.close()
  const flashPackageFile = await flashBlobWriter.getData()
  flashPackageParser = new MapParser(new File([flashPackageFile], 'flash_package.zip'))
  await flashPackageParser.init()
})

test('partitionNameFromMapEntry supports target-files and flash package paths.', () => {
  expect(partitionNameFromMapEntry('IMAGES/system.map')).toBe('system')
  expect(partitionNameFromMapEntry('system.map')).toBe('system')
  expect(partitionNameFromMapEntry('vendor_dlkm.map')).toBe('vendor_dlkm')
  expect(partitionNameFromMapEntry('META/system.map')).toBeNull()
  expect(partitionNameFromMapEntry('IMAGES/readme.txt')).toBeNull()
})

test('Initialize a map parser instance.', () => {
  expect(mapParser.mapFiles.keys().next().value).toEqual('system_test')
})

test('Establish a map of system file.', async () => {
  await mapParser.add('system_test', 11)
  expect(mapParser.maps.get('system_test')).toEqual(systemMap)
})

test('Query the map of system file.', async () => {
  await mapParser.add('system_test', 11)
  const queryExtents = Array.from({ length: 11 }, (_, index) => ({
    startBlock: index,
    numBlocks: 0
  }))
  expect(mapParser.query('system_test', queryExtents)).toEqual(systemMap)
})

test('Initialize map parser from flash package root .map files.', () => {
  expect(flashPackageParser.mapFiles.keys().next().value).toEqual('system_test')
})

test('Establish a map from flash package root .map files.', async () => {
  await flashPackageParser.add('system_test', 11)
  expect(flashPackageParser.maps.get('system_test')).toEqual(systemMap)
})
