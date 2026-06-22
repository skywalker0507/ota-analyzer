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

import { EChartsOption } from 'echarts'
import { formatBytes, toNumericSize } from '../utils/format'

export class EchartsData {
  statisticData: Map<string, number>
  trimmedData: Map<string, number>
  title: string
  unit: string
  maximumEntries: number

  constructor(
    statisticData: Map<string, number>,
    title: string,
    unit: string,
    maximumEntries = 15
  ) {
    this.statisticData = normalizeMap(statisticData)
    this.trimmedData = trimMap(this.statisticData, maximumEntries)
    this.title = title
    this.unit = unit
    this.maximumEntries = maximumEntries
  }

  listData() {
    let table = ''
    for (let [key, value] of this.statisticData) {
      table += key + ' : ' + value.toString() + ' Blocks' + '\n'
    }
    return table
  }

  getEchartsOption(): EChartsOption {
    const option: EChartsOption = {}
    option.title = {
      text: this.title,
      left: 'center'
    }
    option.tooltip = {
      trigger: 'item',
      formatter: (params: any) => {
        if (this.unit == 'blocks') {
          return (
            params.seriesName +
            ' <br/> ' +
            params.name +
            ' : ' +
            params.value +
            ' blocks' +
            '(' +
            params.percent +
            '%)'
          )
        } else {
          return (
            params.seriesName +
            ' <br/> ' +
            reverse(params.name) +
            ' : ' +
            formatBytes(params.value) +
            ' ' +
            '(' +
            params.percent +
            '%)'
          )
        }

        function reverse(str: string) {
          str = str.replace(/</g, '&lt;')
          str = str.replace(/>/g, '&gt;')
          return str
        }
      }
    }
    option.legend = {
      orient: 'horizontal',
      left: 'top',
      top: '10%',
      data: Array.from(this.trimmedData.keys())
    }
    option.series = [
      {
        name: this.title,
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: Array.from(this.trimmedData).map(pair => {
          return { value: pair[1], name: pair[0] }
        }),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
    return option
  }
}

function normalizeMap(map: Map<string, unknown>) {
  const normalized = new Map<string, number>()
  for (const [key, value] of map) {
    normalized.set(String(key), toNumericSize(value))
  }
  return normalized
}

function trimMap(map: Map<string, number>, maximumEntries: number) {
  if (map.size <= maximumEntries) {
    return map
  }
  const newMap = new Map<string, number>()
  for (let i = 0; i < maximumEntries; i++) {
    let curr = 0
    let currKey = ''
    for (let [key, value] of map) {
      if (!newMap.get(key)) {
        if (value > curr) {
          curr = value
          currKey = key
        }
      }
    }
    newMap.set(currKey, curr)
  }
  let restTotal = 0
  for (let [key, value] of map) {
    if (!newMap.get(key)) {
      restTotal += value
    }
  }
  newMap.set('other', restTotal)
  return newMap
}
