import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { pure } from 'recompose'
import * as Nav from 'src/libs/nav'
import { Component } from 'src/libs/wrapped-components'


const root3 = Math.sqrt(3)


const HexagonLayout = pure(({ size, margin, backgroundColor, children }) => {
  const fullSize = size + margin
  const halfSize = fullSize / 2
  const negMargin = (halfSize - 2 * margin) * root3 / 6

  return h(AutoSizer, { disableHeight: true }, [
    ({ width }) => {
      const numInFirstRow = Math.floor(width / fullSize)
      const firstRowWidth = numInFirstRow * fullSize
      const numInSecondRow = numInFirstRow - (width - firstRowWidth < halfSize)
      const totalIn2Rows = numInFirstRow + numInSecondRow

      return div({
        style: {
          display: 'flex', flexWrap: 'wrap', width,
          padding: `${negMargin}px 0`
        }
      }, children.map((child, index) => div({
        style: {
          marginRight: margin,
          marginLeft: (index % totalIn2Rows === numInFirstRow) && halfSize,
          marginTop: -negMargin, marginBottom: -negMargin
        }
      }, [
        div({
          style: {
            position: 'relative',
            width: size, height: 2/3 * root3 * size,
            transform: 'rotate(-60deg) skewY(30deg)',
            overflow: 'hidden', visibility: 'hidden'
          }
        }, [
          div({
            style: {
              position: 'relative',
              width: '100%', height: '100%', backgroundColor,
              transform: 'skewY(-30deg) rotate(60deg)',
              overflow: 'hidden', visibility: 'visible'
            }
          }, [
            child
          ])
        ])
      ])))
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
        size: 200, margin: 10, backgroundColor: 'lightblue'
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
