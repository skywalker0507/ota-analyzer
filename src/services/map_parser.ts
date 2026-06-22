/**
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Class MapParser will take in a Android build and construct
 * several file name maps (physical address: file name) according to it.
 * The map of each partitions is added by calling MapParser.add(partitionName).
 * You can query the file name being operated by calling
 * MapParser.query(address, datalength).
 */

import {
  ZipReader,
  BlobReader,
  TextWriter,
  HttpReader
} from '@zip.js/zip.js'

import { chromeos_update_engine } from './update_metadata_pb'

/** Android dynamic partition names: system, vendor, system_ext, ... */
const PARTITION_NAME_PATTERN = /^[a-z][a-z0-9_]*$/

/**
 * Extract partition name from a .map entry inside a zip.
 * Supports target-files (`IMAGES/system.map`) and flash packages (`system.map`).
 */
export function partitionNameFromMapEntry(filename: string): string | null {
  if (!filename.endsWith('.map') || filename.startsWith('META/')) {
    return null
  }
  const basename = filename.split('/').pop() ?? filename
  const partitionName = basename.slice(0, -'.map'.length)
  if (!PARTITION_NAME_PATTERN.test(partitionName)) {
    return null
  }
  return partitionName
}

/**
 * Higher value = preferred when the same partition appears in multiple paths.
 */
function mapEntryPriority(filename: string): number {
  if (filename.startsWith('IMAGES/')) {
    return 2
  }
  return 1
}

export class MapParser {
  build: ZipReader
  mapFiles: Map<any, any>
  maps: Map<any, any>
  /**
   * This class will take in a .zip Android build and construct a file type map
   * @param {File} targetFile
   */
  constructor(targetFile: File | URL) {
    if (targetFile instanceof File) {
      this.build = new ZipReader(new BlobReader(targetFile))
    } else {
      this.build = new ZipReader(new HttpReader(targetFile.href))
    }
    this.mapFiles = new Map()
    this.maps = new Map()
  }

  /**
   * Find the .map entries in the .zip build file. Store them as a map with
   * pairs of (partition name: zip.js entry).
   */
  async init() {
    const entries = await this.build.getEntries()
    const candidates = new Map<string, { entry: (typeof entries)[number]; priority: number }>()

    for (const entry of entries) {
      const partitionName = partitionNameFromMapEntry(entry.filename)
      if (!partitionName) {
        continue
      }
      const priority = mapEntryPriority(entry.filename)
      const existing = candidates.get(partitionName)
      if (!existing || priority > existing.priority) {
        candidates.set(partitionName, { entry, priority })
      }
    }

    for (const [partitionName, { entry }] of candidates) {
      this.mapFiles.set(partitionName, entry)
    }
  }

  /**
   * According to the .map in the build, build a map for later query.
   * @param {String} partitionName
   * @param {Number} totalLength
   */
  async add(partitionName: string, totalLength: number) {
    let /** Array<String> */ map = []
    const /** RegExp */ regexNumber = /\d+/g
    const /** Reg */ regexRange = /\d+\-\d+/g
    for (let i = 0; i < totalLength; i++) map[i] = `<${partitionName}>`
    if (this.mapFiles.get(partitionName)) {
      let /** String */ mapText = await this.mapFiles
          .get(partitionName)
          .getData(new TextWriter())
      let /** Array<String> */ fileEntries = mapText.split('\n')
      // Each line of the .map file in Android build starts with the filename
      // Followed by the block address, either a number or a range, for example:
      // //system/apex/com.android.adbd.apex 54-66 66 66-2663
      for (let entry of fileEntries) {
        let /** Array<String> */ elements = entry.split(' ')
        for (let j = 1; j < elements.length; j++) {
          let /** Number */ left = 0
          let /** Number */ right = 0
          if (elements[j].match(regexRange)) {
            left = parseInt(elements[j].match(/\d+/g)[0])
            right = parseInt(elements[j].match(/\d+/g)[1])
          } else {
            left = parseInt(elements[j].match(regexNumber))
            right = parseInt(elements[j].match(regexNumber))
          }
          InsertMap(map, elements[0], left, right)
        }
      }
      this.maps.set(partitionName, map)
    } else {
      this.maps.set(partitionName, map)
    }
  }

  /**
   * Return the filename of given address.
   * @param {String} partitionName
   * @param {Array<PartitionUpdate>} extents
   * @return {Array<String>}
   */
  query(partitionName: string, extents: Array<chromeos_update_engine.IExtent>) {
    let /** Array<String> */ names = []
    let /** Array<String> */ map = this.maps.get(partitionName)
    for (let ext of extents) {
      names.push(queryMap(map, ext.startBlock, ext.startBlock + ext.numBlocks))
    }
    return names
  }
}

/**
 * Fill in the hashtable from <left> to <right> using <name>.
 * @param {Array<String>} map
 * @param {String} name
 * @param {Number} left
 * @param {Number} right
 */
function InsertMap(
  map: Array<string>,
  name: string,
  left: number,
  right: number
) {
  for (let i = left; i <= right; i++) {
    map[i] = name
  }
}

/**
 * Query the hashtable <map> using index <address>.
 * @param {Array<String>} map
 * @param {Number} left
 * @param {Number} right
 */
function queryMap(map: Array<string>, left: number, right: number) {
  // Assuming the consecutive blocks belong to the same file
  // Only the start block is queried here.
  if (!map[left]) {
    return 'unknown'
  }
  return map[left]
}
