import _ from 'lodash/fp'
import { div, h, polygon, svg } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { pure } from 'recompose'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


const root3 = Math.sqrt(3)


const HexagonLayout = pure(({ size, margin, backgroundColor, borderRadius=0, children }) => {
  const fullSize = size + margin
  const halfSize = fullSize / 2
  const negMargin = (halfSize - 2 * margin) * root3 / 6

  const y1 = size*root3/6
  const y2 = size*root3/2
  const height = size*root3*2/3

  const midYadj = borderRadius*root3/3
  const topYadj = borderRadius*root3*2/3

  return h(AutoSizer, { disableHeight: true }, [
    ({ width }) => {
      const numInFirstRow = Math.floor(width / fullSize)
      const firstRowWidth = numInFirstRow * fullSize
      const numInSecondRow = numInFirstRow - (width - firstRowWidth < halfSize)
      const totalIn2Rows = numInFirstRow + numInSecondRow

      const hex = (child, index) => div({
        style: {
          position: 'relative', width: size, height,
          marginRight: margin,
          marginLeft: (index % totalIn2Rows === numInFirstRow) && halfSize,
          marginTop: -negMargin, marginBottom: -negMargin
        }
      }, [
        svg({
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: `0 0 ${size} ${height}`,
          style: {
            width: size, height
          }
        }, [
          polygon({
            points: `${borderRadius},${y1+midYadj}
                     ${size/2},${topYadj}
                     ${size-borderRadius},${y1+midYadj}
                     ${size-borderRadius},${y2-midYadj}
                     ${size/2},${height-topYadj}
                     ${borderRadius},${y2-midYadj}`,
            fill: backgroundColor,
            stroke: backgroundColor,
            strokeWidth: borderRadius*2,
            strokeLinejoin: 'round'
          })
        ]),
        child
      ])

      return div({
        style: {
          display: 'flex', flexWrap: 'wrap', width,
          padding: `${negMargin}px 0`
        }
      }, [
        children.map(hex)
      ])
    }
  ])
})


class HexagonDemo extends Component {
  render() {
    return div({
      style: {
        margin: '4rem',
        border: '1px solid black'
      }
    }, [
      h(HexagonLayout, {
        size: 200, margin: 16, borderRadius: 20, backgroundColor: 'lightblue'
      }, _.map(number => div({
        style: {
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
        }
      }, [number]), _.range(0, 100)))
    ])
  }
}


export const addNavPaths = () => {
  Nav.defPath('hexagon-demo', {
    path: '/hexagon-demo',
    component: HexagonDemo,
    title: 'Hexagon Demo'
  })
}
