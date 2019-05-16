import _ from 'lodash/fp'
import { Component } from 'src/libs/wrapped-components'
import { div, h } from 'react-hyperscript-helpers'
import Modal from 'src/components/Modal'
import { buttonPrimary, LabeledCheckbox, Clickable, linkButton, Select } from 'src/components/common'
import * as Utils from 'src/libs/utils'
import { AutoSizer, List } from 'react-virtualized'
import { ajaxCaller } from 'src/libs/ajax'

const styles = {
  columnName: {
    paddingLeft: '0.25rem',
    flex: 1, display: 'flex', alignItems: 'center',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  }
}

const getStrings = v => {
  return Utils.cond(
    [_.isString(v), () => [v]],
    [v && v.items, () => _.map(getStrings, v.items)],
    () => []
  )
}

const MAX_CONCURRENT_IGV_FILES = 10

const isGs = uri => _.startsWith('gs://', uri)

const parseUri = uri => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri))
const googleProject = 'general-dev-billing-account'

const IGVFileSelector = ajaxCaller(class IGVFileSelector extends Component {
//export class IGVFileSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedFiles: _.fromPairs(_.map(v => [v, false], this.getIGVFileList())),
      refGenome: 'hg38',
      inPreFlightCheck: false,
      loadingError: undefined
    }
  }

  toggleVisibility(name) {
    this.setState(_.update(['selectedFiles', name], b => !b))
  }

  getIGVFileList() {
    const { selectedEntities } = this.props
    return _.flow(
      _.flatMap(row => _.flatMap(getStrings, row.attributes)),
      _.uniq,
      _.filter(v => /\.(cram|bam|bed|vcf)$/.test(v))
    )(selectedEntities)
  }

  getSelectedFilesList() {
    const { selectedFiles } = this.state
    return _.flow(
      _.keys,
      _.filter(v => selectedFiles[v])
    )(selectedFiles)
  }

  buttonIsDisabled() {
    const selectedFilesList = this.getSelectedFilesList()
    return !(selectedFilesList.length > 0 && selectedFilesList.length <= MAX_CONCURRENT_IGV_FILES)
  }

  setAll(value) {
    this.setState({ 'selectedFiles': _.fromPairs(_.map(v => [v, value], this.getIGVFileList())) })
  }

  async preFlightCheck(selectedFiles) {
    // For each selected file
    // Do a fetch. Check its status code.
    // Fetch the index. Check its status code.
    // If all status codes are 200, good to go.
    this.setState({ inPreFlightCheck: true })
    const { ajax: { Buckets, Martha } } = this.props
    try {
      await Promise.all(_.map(async uri => {
        const isGsUri = isGs(uri)
        const [bucket, name] = isGsUri ? parseUri(uri) : []
        const { ...metadata } = isGsUri ? await Buckets.getObject(bucket, name, googleProject) : await Martha.call(uri)
        console.log(metadata)
        if (isGsUri) {
          //const signedUrl = (await Martha.call(uri)).signedUrl
          //console.log('signedUrl: ', signedUrl)
          console.log('Martha', (await Martha.call(uri)))
        }
      }, selectedFiles))
    } catch (e) {
      this.setState({ loadingError: await e.json(), inPreFlightCheck: false })
      return false
    }
    return true
  }

  renderError() {
    const { loadingError } = this.state
    return div({}, [JSON.stringify(loadingError, null, 2)])
  }

  render() {
    const { onDismiss, onSuccess } = this.props
    const { selectedFiles, refGenome, inPreFlightCheck, loadingError } = this.state
    const trackFiles = this.getIGVFileList()
    return h(Modal, {
      onDismiss,
      title: 'Open files with IGV',
      okButton: buttonPrimary({
        disabled: this.buttonIsDisabled() || inPreFlightCheck,
        tooltip: this.buttonIsDisabled() ? `Select between 1 and ${MAX_CONCURRENT_IGV_FILES} files` : '',
        onClick: async () => {
          const a = await this.preFlightCheck(this.getSelectedFilesList())
          if (a) {
            onSuccess({ selectedFiles: this.getSelectedFilesList(), refGenome })
          }
        }
      }, [inPreFlightCheck ? 'Thinking...' : 'Open in IGV'])
    }, [
      div({ style: { marginBottom: '1rem', display: 'flex' } }, [
        div({ style: { fontWeight: 500 } }, ['Select:']),
        linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.setAll(true) }, ['all']),
        '|',
        linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.setAll(false) }, ['none'])
      ]),
      loadingError ?
        this.renderError():
        h(AutoSizer, { disableHeight: true }, [
          ({ width }) => {
            return h(List, {
              width, height: 400,
              rowCount: trackFiles.length,
              rowHeight: 30,
              noRowsRenderer: () => 'No valid files found',
              rowRenderer: ({ index, style, key }) => {
                const name = trackFiles[index]
                return div({ key, index, style: { ...style, display: 'flex' } }, [
                  div({ style: { display: 'flex', alignItems: 'center' } }, [
                    h(LabeledCheckbox, {
                      checked: selectedFiles[name],
                      onChange: () => this.toggleVisibility(name)
                    })
                  ]),
                  h(Clickable, {
                    style: styles.columnName,
                    title: name,
                    onClick: () => this.toggleVisibility(name)
                  }, [_.last(name.split('/'))])
                ])
              }
            })
          }
        ]),
      div({ style: { fontWeight: 500 } }, [
        'Reference genome: ',
        div({ style: { display: 'inline-block', marginLeft: '0.25rem', minWidth: 125 } }, [
          h(Select, {
            options: ['hg38', 'hg19', 'hg18', 'mm10', 'panTro4', 'panPan2', 'susScr11',
              'bosTau8', 'canFam3', 'rn6', 'danRer10', 'dm6', 'sacCer3'],
            value: refGenome,
            onChange: ({ value }) => this.setState({ refGenome: value })
          })
        ])
      ])
    ])
  }
})

export default IGVFileSelector
