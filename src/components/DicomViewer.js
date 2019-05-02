import _ from 'lodash/fp'
import { div } from 'react-hyperscript-helpers'
import { createRef } from 'react'
import { Component } from 'src/libs/wrapped-components'
import dicomParser from 'dicom-parser'
import cornerstone from 'cornerstone-core'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'

export class DicomViewer extends Component {
  constructor(props) {
    super(props)
    this.containerRef = createRef()
  }

  render() {
    return (
      div({ ref: this.containerRef })
    )
  }

  getBlobUrl(url) {
    const baseUrl = window.URL || window.webkitURL
    const blob = new Blob([`importScripts('${url}')`], {
      type: 'application/javascript'
    })

    return baseUrl.createObjectURL(blob)
  }

  componentDidMount() {
    const webWorkerUrl = this.getBlobUrl(
      'https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderWebWorker.min.js'
    )
    const codecsUrl = this.getBlobUrl(
      'https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderCodecs.js'
    )
    const config = {
      webWorkerPath: webWorkerUrl,
      taskConfiguration: {
        decodeTask: {
          codecsPath: codecsUrl
        }
      }
    }
    try {
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone
      cornerstoneWADOImageLoader.external.dicomParser = dicomParser
      cornerstoneWADOImageLoader.webWorkerManager.initialize(config)
    } catch (error) {
      // Already initialized
      console.log('Error:', error)
    }
    this.loadAndViewImage()
  }

  loadAndViewImage() {
    const { uri } = this.props
    //  gs://fc-0ba57297-545e-4f56-92f4-ebb45cb19a59/00001088_022.dcm
    console.log('uri:', uri)
    const filename = _.last(uri.split('/'))
    //const imageId = 'wadouri:https://gcs-public-data--healthcare-nih-chest-xray.storage.googleapis.com/dicom/00001088_022.dcm'
    //https://storage.googleapis.com/aaa-willyn-test-genomics/MRBRAIN.DCM
    const imageId = 'wadouri:http://localhost:8000/' + filename
    const element = this.containerRef.current
    cornerstone.enable(element)
    console.log('element:', element)
    cornerstone.loadAndCacheImage(imageId).then(image => {
      console.log(image)
      cornerstone.displayImage(element, image)
    }, err => {
      console.log(err)
      alert(err)
    })
  }
}
