import _ from 'lodash/fp'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { code, div, h, h2, h3, h4, li, p, span, strong, ul } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { ButtonPrimary, Link, Select, topSpinnerOverlay, transparentSpinnerOverlay } from 'src/components/common'
import { FileBrowserPanel } from 'src/components/data/FileBrowser'
import UploadPreviewTable from 'src/components/data/UploadPreviewTable'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { DelayedSearchInput } from 'src/components/input'
import { NameModal } from 'src/components/NameModal'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import TopBar from 'src/components/TopBar'
import { NoWorkspacesMessage, useWorkspaces, WorkspaceTagSelect } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'

// As you add support for uploading additional types of metadata, add them here.
// You may also need to adjust the validation logic.
const supportedEntityTypes = ['entity']

const rootPrefix = 'uploads/'

const styles = {
  pageContainer: {
    display: 'flex',
    flex: 1,
    flexFlow: 'row no-wrap',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    justifyContent: 'space-between'
  },
  tableContainer: {
    display: 'flex', flex: 1
  },
  dataTypeSelectionPanel: {
    flex: 'none', width: 280, backgroundColor: 'white',
    boxShadow: '0 2px 5px 0 rgba(0,0,0,0.25)'
  },
  dataTypeActive: {
    color: colors.light(),
    backgroundColor: colors.accent()
  },
  tableViewPanel: {
    position: 'relative',
    padding: '1rem',
    width: '100%',
    height: '100%'
  },
  workspaceTilesContainer: {
    textAlign: 'left',
    margin: 0,
    padding: 0,
    listStyle: 'none'
  },
  workspaceTile: {
    display: 'block',
    width: '100%',
    borderRadius: '5px',
    padding: '1rem',
    overflowWrap: 'break-word',
    backgroundColor: 'white',
    boxShadow: 'rgba(0, 0, 0, 0.35) 0px 2px 5px 0px, rgba(0, 0, 0, 0.12) 0px 3px 2px 0px',
    // minHeight: '125px',
    margin: '0px 1rem 2rem 0px'
  },
  workspaceTileSelected: {
    backgroundColor: colors.accent(),
    color: 'white'
  },
  tabPanelHeader: {
    position: 'relative',
    height: '100%'
  },
  heading: {
    ...Style.elements.sectionHeader,
    margin: '1rem 0',
    textTransform: 'uppercase',
    textAlign: 'center',
    verticalAlign: 'middle'
  },
  instructions: {
    lineHeight: '1.4em'
  },
  nextLink: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: '1rem 0'
  },
  filter: { marginRight: '1rem', flex: '1 0 auto', minWidth: '10em' }
}

const NextLink = ({ step, setCurrentStep, stepIsEnabled }) => {
  return div({
    style: styles.nextLink
  }, [
    h(ButtonPrimary, {
      disabled: !stepIsEnabled(step),
      onClick: () => setCurrentStep(step)
    }, ['Next >'])
  ])
}

const AccordionHeader = ({ iconShape, title, onClick, children, ...props }) => {
  return h(Link, {
    as: 'button',
    style: {
      display: 'flex', flexFlow: 'row nowrap', width: '100%',
      border: '1px solid', borderColor: colors.dark(0.5), borderRadius: '0.5em',
      textAlign: 'left', justifyContent: 'stretch', alignItems: 'space-evenly',
      padding: '1em', margin: '0 0 1em 0', fontSize: '1rem'
    },
    onClick,
    ...props
  }, [
    div({
      style: { flex: '0 0 auto', width: '20em' }
    }, [
      icon(iconShape, { size: 20, style: { margin: '0 1rem' } }),
      span({
        style: { textTransform: 'uppercase' }
      }, [title])
    ]),
    div({
      style: { flex: 1 }
    }, [
      children
    ]),
    div({
      style: { flex: 0 }
    }, [
      h(Link, {
      }, ['Change'])
    ])
  ])
}

const WorkspaceSelectorPanel = ({
  workspaces, selectedWorkspaceId, setWorkspaceId, setCreatingNewWorkspace, children, ...props
}) => {
  const [filter, setFilter] = useState(StateHistory.get().filter || '')
  const [projectsFilter, setProjectsFilter] = useState(StateHistory.get().projectsFilter || undefined)
  const [tagsFilter, setTagsFilter] = useState(StateHistory.get().tagsFilter || [])

  useEffect(() => {
    StateHistory.update({ filter, projectsFilter, tagsFilter })
  }, [filter, projectsFilter, tagsFilter])

  // Move the focus to the header the first time this panel is rendered
  const header = useRef()
  useEffect(() => {
    header.current && header.current.focus()
  }, [])

  const filteredWorkspaces = useMemo(() => _.filter(ws => {
    const { workspace: { namespace, name, attributes } } = ws
    return Utils.textMatch(filter, `${namespace}/${name}`) &&
      (_.isEmpty(projectsFilter) || projectsFilter === namespace) &&
      _.every(a => _.includes(a, _.get(['tag:tags', 'items'], attributes)), tagsFilter)
  }, workspaces), [workspaces, filter, projectsFilter, tagsFilter])

  return div([
    h2({ style: styles.heading }, [
      icon('view-cards', { size: 20, style: { marginRight: '1em' } }),
      span({ ref: header, tabIndex: -1 }, ['Select a Workspace']),
      h(Link, {
        'aria-label': 'Create new workspace', onClick: () => setCreatingNewWorkspace(true),
        style: { marginLeft: '0.5rem' },
        tooltip: 'Create a new workspace'
      },
      [icon('lighter-plus-circle', { size: 24 })])
    ]),
    p({ style: styles.instructions }, [
      'You must first select the workspace you wish to upload your files into. You have access to the following workspaces:'
    ]),
    children,
    div({ style: { display: 'flex', marginBottom: '2rem', alignItems: 'center' } }, [
      span({
        style: { position: 'absolute', left: -9999 },
        'aria-live': 'polite', 'aria-atomic': true
      }, [
        (filter || tagsFilter?.length > 0 || projectsFilter) ?
          span([
            'Filtering workspaces by ',
            Utils.commaJoin(_.compact([
              filter ? `search term: ${filter}` : null,
              tagsFilter?.length > 0 ? `tags: ${tagsFilter}` : null,
              projectsFilter ? `project: ${projectsFilter}` : null
            ]), 'and')
          ]) :
          'not filtering workspaces'
      ]),
      div({ style: styles.filter }, [
        h(DelayedSearchInput, {
          placeholder: 'Search Workspaces',
          'aria-label': 'Search workspaces',
          onChange: setFilter,
          value: filter
        })
      ]),
      div({ style: styles.filter }, [
        h(WorkspaceTagSelect, {
          isClearable: true,
          isMulti: true,
          formatCreateLabel: _.identity,
          value: _.map(tag => ({ label: tag, value: tag }), tagsFilter),
          placeholder: 'Tags',
          'aria-label': 'Filter by tags',
          onChange: data => setTagsFilter(_.map('value', data))
        })
      ]),
      div({ style: styles.filter }, [
        h(Select, {
          isClearable: true,
          isMulti: false,
          placeholder: 'Billing project',
          'aria-label': 'Filter by billing project',
          value: projectsFilter,
          hideSelectedOptions: true,
          onChange: data => setProjectsFilter(!!data ? data.value : undefined),
          options: _.flow(
            _.map('workspace.namespace'),
            _.uniq,
            _.sortBy(_.identity)
          )(workspaces)
        })
      ]),
      div({ style: { ...styles.filter, flex: '0 0 auto', minWidth: undefined } }, [
        h(Link, {
          'aria-label': 'Clear filters',
          onClick: () => {
            setFilter('')
            setProjectsFilter(undefined)
            setTagsFilter([])
          }
        }, ['Clear'])
      ])
    ]),
    ul({
      style: styles.workspaceTilesContainer
    }, [
      _.flow(
        _.sortBy([
          ws => ws.workspace.workspaceId !== selectedWorkspaceId,
          ws => ws.workspace.namespace.toLowerCase(),
          ws => ws.workspace.name.toLowerCase()
        ]),
        _.map(w => {
          const { workspace: { workspaceId, namespace, name, lastModified, createdBy, attributes: { description } } } = w

          return li({
            key: workspaceId
          }, [
            h(Link, {
              'aria-selected': workspaceId === selectedWorkspaceId,
              style: _.merge(styles.workspaceTile, workspaceId === selectedWorkspaceId ? styles.workspaceTileSelected : {}),
              onClick: () => setWorkspaceId(workspaceId),
              variant: workspaceId === selectedWorkspaceId ? 'light' : 'dark'
            }, [
              h3({
                style: { margin: '0 0 1rem 0' }
              }, [namespace, ' > ', name]),
              div({
                style: { ...styles.tableCellContent }
              }, [
                description ? span({
                  style: {
                    ...Style.noWrapEllipsis,
                    color: workspaceId === selectedWorkspaceId ? colors.light(0.75) : colors.dark(0.75)
                  }
                }, [
                  description?.split('\n')[0] || 'No description added'
                ]) : null
              ]),
              div({
                style: { display: 'flex', flex: 'row nowrap', width: '100%', justifyContent: 'space-between' }
              }, [
                div({
                  style: {
                    color: workspaceId === selectedWorkspaceId ? colors.light(0.75) : colors.dark(0.75),
                    paddingTop: '1em',
                    flexFlow: '1 1 auto'
                  }
                }, [
                  span('Last Modified: '),
                  span([Utils.makeStandardDate(lastModified)])
                ]),
                div({
                  style: {
                    color: workspaceId === selectedWorkspaceId ? colors.light(0.75) : colors.dark(0.75),
                    paddingTop: '1em',
                    flexFlow: '1 1 auto'
                  }
                }, [
                  span('Created By: '),
                  span([createdBy])
                ])
              ])
            ])
          ])
        })
      )(filteredWorkspaces)
    ])
  ])
}

const CollectionSelectorPanel = _.flow(
  Utils.withDisplayName('CollectionSelectorPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({
  workspace, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError, selectedCollection, setCollection, children, ...props
}) => {
  // State
  const [collections, setCollections] = useState(undefined)
  const [isLoading, setLoading] = useState(false)
  const [isCreating, setCreating] = useState(false)

  // Move the focus to the header the first time this panel is rendered
  const header = useRef()
  useEffect(() => {
    header.current && header.current.focus()
  }, [])

  const signal = Utils.useCancellation()

  // Helpers
  const load = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const { prefixes } = await Ajax(signal).Buckets.list(namespace, bucketName, rootPrefix)
    setCollections(_.flow(
      // Slice off the root and the trailing slash
      _.map(p => p.slice(rootPrefix.length, p.length - 1)),
      _.concat(selectedCollection),
      _.uniq,
      _.compact,
      _.sortBy([p => p !== selectedCollection, p => p])
    )(prefixes))
  })

  // Lifecycle
  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Render

  return h(div, {}, [
    h2({ style: styles.heading }, [
      icon('folder', { size: 20, style: { marginRight: '1em' } }),
      span({ ref: header, tabIndex: -1 }, ['Select a collection']),
      h(Link, {
        'aria-label': 'Create new collection', onClick: () => setCreating(true),
        style: { marginLeft: '0.5rem' },
        tooltip: 'Create a new collection'
      },
      [icon('lighter-plus-circle', { size: 24 })])
    ]),
    p({ style: styles.instructions }, [
      'Each collection represents a group of files with a single metadata file describing the table structure. ',
      'You can create a new collection, or add files to an existing one. '
    ]),
    children,
    collections?.length > 0 && h3({}, ['Choose an existing collection']),
    ul({
      style: styles.workspaceTilesContainer
    }, [
      _.map(prefix => {
        return li({
          key: prefix
        }, [
          h(Link, {
            'aria-selected': prefix === selectedCollection,
            style: _.merge(styles.workspaceTile, prefix === selectedCollection ? styles.workspaceTileSelected : {}),
            onClick: () => setCollection(prefix),
            variant: prefix === selectedCollection ? 'light' : 'dark'
          }, [
            h4({
              style: { margin: '0 0 1rem 0' }
            }, [prefix])
          ])
        ])
      }, collections)
    ]),
    h(Link, {
      style: { margin: '2em 0 0 0', textAlign: 'center', width: '100%', display: 'block' },
      onClick: () => setCreating(true)
    }, [
      icon('plus'),
      ' Create a new collection'
    ]),
    isCreating && h(NameModal, {
      thing: 'Collection',
      onDismiss: () => setCreating(false),
      onSuccess: ({ name }) => setCollection(name)
    }),
    isLoading && topSpinnerOverlay
  ])
})

const DataUploadPanel = _.flow(
  Utils.withDisplayName('DataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, onRequesterPaysError, collection, setNumFiles, children }) => {
  const basePrefix = `${rootPrefix}${collection}/`

  // Move the focus to the header the first time this panel is rendered
  const header = useRef()
  useEffect(() => {
    header.current && header.current.focus()
  }, [])

  return h(Fragment, {}, [
    h2({ style: styles.heading }, [
      icon('fileAlt', { size: 20, style: { marginRight: '1em' } }),
      span({ ref: header, tabIndex: -1 }, ['Upload Your Data Files'])
    ]),
    p({ style: styles.instructions }, [
      'Upload the files to associate with this collection by dragging them into the table below, or clicking the Upload button.'
    ]),
    p({ style: styles.instructions }, [
      ' You may upload as many files as you wish, but each filename must be unique even within sub-folders.'
    ]),
    children,
    h(FileBrowserPanel, {
      workspace, onRequesterPaysError, setNumFiles, basePrefix, collection, allowNewFolders: false
    })
  ])
})

const MetadataUploadPanel = _.flow(
  Utils.withDisplayName('MetadataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({
  workspace, workspace: { workspace: { namespace, bucketName, name } },
  onRequesterPaysError, onSuccess, collection, children
}) => {
  const basePrefix = `${rootPrefix}${collection}/`
  const [filesLoading, setFilesLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [metadataFile, setMetadataFile] = useState(null)
  const [metadataTable, setMetadataTable] = useState(null)
  const [filenames, setFilenames] = useState({})

  const setErrors = errors => {
    setMetadataTable({ errors })
  }

  const isPreviewing = metadataTable?.rows?.length > 0
  const hasErrors = metadataTable?.errors?.length > 0

  // Move the focus to the header the first time this panel is rendered
  const header = useRef()
  useEffect(() => {
    header.current && header.current.focus()
  }, [])

  const signal = Utils.useCancellation()

  // Get every filename in the bucket, so we can do substitutions
  useEffect(() => {
    _.flow( // eslint-disable-line lodash-fp/no-unused-result
      withRequesterPaysHandler(onRequesterPaysError),
      withErrorReporting('Error loading bucket data'),
      Utils.withBusyState(setFilesLoading)
    )(async () => {
      // Fetch every object in the entire bucket so we don't have to do it recursively, but then
      // filter out any that aren't in our base prefix
      const items = await Ajax(signal).Buckets.listAll(namespace, bucketName)

      // Hash the filenames without any prefixes for easy lookup
      setFilenames(_.flow(
        _.filter(item => item.name.startsWith(basePrefix)),
        _.map(item => [_.last(item.name.split('/')), `gs://${bucketName}/${item.name}`]),
        _.fromPairs
      )(items))
    })()
  }, [collection]) // eslint-disable-line react-hooks/exhaustive-deps

  const parseMetadata = async file => {
    if (!file) {
      setMetadataTable(null)
      return
    }
    const errors = []

    try {
      // Read the file contents
      const text = await Utils.readFileAsText(file)

      // Split rows by newlines and columns by tabs
      const rows = _.flow(
        _.split(/\r\n|\r|\n/),
        _.compact,
        _.map(row => row.split('\t'))
      )(text)

      const headerRow = _.head(rows)
      const idColumn = _.head(headerRow)
      let otherRows = _.drop(1, rows)

      // Perform validation on the first row
      if (!idColumn) {
        errors.push(['This does not look like a valid .tsv file.'])
        // Return right away
        setErrors(errors)
        return
      }
      const entityTypes = _.map(t => `${t}:`, supportedEntityTypes)

      // TODO Add more validation
      if (!_.some(t => idColumn.startsWith(t), entityTypes)) {
        errors.push(div([
          'The first column header ', code(idColumn), ' must start with ', Utils.commaJoin(_.map(t => code([t]), entityTypes))
        ]))
      }
      if (!idColumn.endsWith('_id')) {
        errors.push(div(['The first column header ', code(idColumn), ' must end with ', code('_id')]))
      }
      const matches = idColumn?.match(/^([A-Za-z_-]+):([A-Za-z0-9-_.]+)_id$/)
      if (errors.length === 0 && !matches) {
        errors.push(div(['The first column header ', code(idColumn), ' must only include alphanumeric characters, dashes, periods or underscores']))
      }
      if (headerRow.length < 2) {
        errors.push('Your metadata file must include at least 2 columns')
      }

      // Make sure no rows are longer than the header row (we take care of padding shorter rows later)
      _.forEach(([i, row]) => {
        if (row.length > headerRow.length) {
          errors.push(span(['Row ', strong(i), ' [', code(row[0]), '] has too many columns; expected ', strong(headerRow.length), ' but found ', strong(row.length)]))
        }
      }, Utils.toIndexPairs(rows))

      if (errors.length > 0) {
        setErrors(errors)
      } else {
        const entityClass = matches[1]
        const entityType = matches[2]
        const idName = `${entityType}_id`

        // Process each row
        otherRows = _.map(_.flow(
          // Pad all rows to the same length as the header, or else the import will fail
          row => _.concat(row, _.map(() => '', _.range(0, headerRow.length - row.length))),
          // Replace any file references with bucket paths
          _.map(cell => cell in filenames ? filenames[cell] : cell)
        ), otherRows)

        setMetadataTable({ errors, entityClass, entityType, idName, idColumn, columns: headerRow, rows: otherRows })
      }
    } catch (e) {
      console.error('Failed to parse metadata file', e)
      setErrors(['We were unable to process the metadata file. Are you sure it is in the proper format?'])
    }
  }

  const renameTable = ({ name }) => {
    setMetadataTable(m => {
      const idColumn = `${m.entityClass}:${name}_id`
      return {
        ...m,
        entityType: name,
        idName: `${name}_id`,
        idColumn,
        columns: [idColumn, ..._.drop(1, m.columns)]
      }
    })
  }

  // Parse the metadata TSV file so we can show a preview. Refresh this parsing anytime the filenames or entities change
  useEffect(() => {
    parseMetadata(metadataFile)
  }, [metadataFile, filenames]) // eslint-disable-line react-hooks/exhaustive-deps

  const doUpload = _.flow( // eslint-disable-line lodash-fp/no-single-composition
    Utils.withBusyState(setUploading)
  )(async metadata => {
    try {
      // Convert the table data structure back into a TSV, in case the user made changes
      const file = Utils.makeTSV([metadata.table.columns, ...metadata.table.rows])
      const workspace = Ajax().Workspaces.workspace(namespace, name)
      await workspace.importFlexibleEntitiesFile(file)
      onSuccess && onSuccess({ file, metadata })
    } catch (error) {
      await reportError('Failed to upload entity metadata', error)
    }
  })

  // Render

  return div({ style: { height: '100%', display: 'flex', flexFlow: 'column nowrap' } }, [
    h2({ style: { ...styles.heading, flex: 0 } }, [
      icon('listAlt', { size: 20, style: { marginRight: '1em' } }),
      span({ ref: header, tabIndex: -1 }, ['Upload Your Metadata Files'])
    ]),
    div({ style: { ...styles.instructions, flex: 0 } }, [
      p('Upload a tab-separated file describing your table structures.'),
      ul([
        li('Any columns which reference files should include just the filenames, which will be matched up to the data files in this collection.'),
        li([
          p([
            'The first column must contain the unique identifiers for each row. The name of the first column must start with ',
            code('entity:'), ' followed by the table name, followed by ', code('_id'), '.'
          ])
        ])
      ]),
      p([
        'For example, if the first column is named ',
        code('entity:sample_id'),
        ', a table named "sample" will be created with "sample_id" as its first column. There are no restrictions on other columns.'
      ])
    ]),
    children,
    !isPreviewing && h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace),
      style: {
        flex: 0, backgroundColor: 'white', border: `1px dashed ${colors.dark(0.55)}`,
        padding: '1rem', position: 'relative', height: '7rem'
      },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      multiple: false,
      maxFiles: 1,
      accept: '.tsv',
      onDropAccepted: ([file]) => {
        setMetadataFile(file)
      },
      onDropRejected: errors => {
        const e = _.flatMap(error => {
          return _.map(e => e.message, error.errors)
        }, errors)
        setMetadataTable({ errors: e })
      }
    }, [
      ({ openUploader }) => h(Fragment, [
        div({
          style: {
            color: colors.dark(0.75), width: '100%', margin: '2rem 0', textAlign: 'center',
            fontSize: '1.5em'
          }
        }, ['Drag and drop your metadata .tsv file here']),
        !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
          label: 'UPLOAD',
          iconShape: 'plus',
          onClick: openUploader
        })
      ])
    ]),
    hasErrors && div({
      style: { color: colors.danger(), flex: 1 }
    }, [
      h2(['Error!']),
      p('The following errors occurred. Please correct them and then try your upload again.'),
      ul([
        _.map(e => li({ key: e }, [e]), metadataTable.errors)
      ])
    ]),
    isPreviewing && div({
      style: { borderTop: '1px solid', borderColor: colors.dark(0.75), flex: 1 }
    }, [
      h(UploadPreviewTable, {
        workspace, metadataTable,
        onConfirm: ({ metadata }) => {
          doUpload(metadata)
        },
        onCancel: () => {
          setMetadataFile(null)
          setMetadataTable(null)
        },
        onRename: renameTable
      })
    ]),
    (filesLoading || uploading) && topSpinnerOverlay
  ])
})

const DonePanel = ({ workspace, workspace: { workspace: { namespace, name } }, tableName, collection, setCurrentStep }) => {
  // Move the focus to the header the first time this panel is rendered
  const header = useRef()
  useEffect(() => {
    header.current && header.current.focus()
  }, [])

  return div([
    h2({ style: styles.heading }, [
      span({ ref: header, tabIndex: -1 }, ['Done!'])
    ]),
    workspace && div({
      style: {}
    }, [
      p([
        h(Link, {
          href: Nav.getLink('workspace-data', { namespace: workspace.workspace.namespace, name: workspace.workspace.name }),
          onClick: () => StateHistory.update({ selectedDataType: tableName })
        }, [
          icon('view-cards'),
          ' View the ', code([tableName]), ' table in the workspace'
        ])
      ]),
      p([
        h(Link, {
          onClick: () => setCurrentStep('metadata')
        }, [
          icon('listAlt'),
          ' Create a new table in the ', code([collection]), ' collection'
        ])
      ]),
      p([
        h(Link, {
          onClick: () => setCurrentStep('workspaces')
        }, [
          icon('folder'),
          ' Start over with another workspace or collection'
        ])
      ])
    ])
  ])
}

const UploadData = _.flow( // eslint-disable-line lodash-fp/no-single-composition
  Utils.forwardRefWithName('Upload')
)((props, ref) => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()

  // State
  const { query } = Nav.useRoute()
  const [currentStep, setCurrentStep] = useState(StateHistory.get().currentStep || 'workspaces')
  const [workspaceId, setWorkspaceId] = useState(query.workspace)
  const [collection, setCollection] = useState(query.collection)
  const [creatingNewWorkspace, setCreatingNewWorkspace] = useState(false)
  const [numFiles, setNumFiles] = useState(StateHistory.get().numFiles)
  const [tableName, setTableName] = useState(StateHistory.get().tableName)
  const [tableMetadata, setTableMetadata] = useState(StateHistory.get().tableMetadata)

  useEffect(() => {
    Nav.updateSearch(query, { workspace: workspaceId, collection })
  }, [workspaceId, collection]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    StateHistory.update({ currentStep, numFiles, tableName, tableMetadata })
  }, [currentStep, numFiles, tableName, tableMetadata])

  const workspace = useMemo(() => {
    return workspaceId ? _.find({ workspace: { workspaceId } }, workspaces) : null
  }, [workspaces, workspaceId])

  // Steps through the wizard
  const steps = [
    { step: 'workspaces', test: () => true },
    { step: 'collection', test: () => workspace, clear: () => setCollection(undefined) },
    { step: 'data', test: () => collection, clear: () => setNumFiles(0) },
    { step: 'metadata', test: () => numFiles > 0, clear: () => setTableName(undefined) },
    { step: 'done', test: () => tableName }
  ]

  const stepIsEnabled = step => {
    const s = _.find({ step }, steps)
    return s && s.test()
  }

  // Make sure we have a valid step once the workspaces have finished loading
  useEffect(() => {
    if (!stepIsEnabled(currentStep) && !loadingWorkspaces) {
      let last = steps[0]
      for (const step of steps) {
        if (!step.test()) {
          setCurrentStep(last.step)
          return
        }
        last = step
      }
    }
    // Run any initialization steps to ensure we clear out data from later steps
    const i = _.findIndex({ step: currentStep }, steps)
    _.forEach(step => step.clear && step.clear(), _.drop(i + 1, steps))
  }, [currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredWorkspaces = useMemo(() => {
    return _.filter(ws => {
      return Utils.canWrite(ws.accessLevel) // && (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
    }, workspaces)
  }, [workspaces])

  // Render
  return h(FooterWrapper, [
    h(TopBar, { title: 'Data Uploader', href: Nav.getLink('upload') }, []),
    div({ role: 'main', style: { padding: '1.5rem', flex: '1 1 auto', fontSize: '1.2em' } }, [
      filteredWorkspaces.length === 0 && !loadingWorkspaces ?
        h(NoWorkspacesMessage, { onClick: () => setCreatingNewWorkspace(true) }) :
        div({ style: styles.tableViewPanel }, [
          workspace && currentStep !== 'workspaces' && h(AccordionHeader, {
            iconShape: 'view-cards',
            title: 'Workspace',
            onClick: () => setCurrentStep('workspaces')
          }, [
            div({ style: { fontSize: '0.8em' } }, [workspace.workspace.namespace]),
            div({ style: { fontSize: '1.2em' } }, [workspace.workspace.name])
          ]),
          collection && currentStep !== 'collection' && h(AccordionHeader, {
            iconShape: 'folder',
            title: 'Collection',
            onClick: () => setCurrentStep('collection')
          }, [
            strong([collection])
          ]),
          numFiles > 0 && currentStep !== 'data' && h(AccordionHeader, {
            iconShape: 'fileAlt',
            title: 'Data Files',
            onClick: () => setCurrentStep('data')
          }, [
            'Includes ', strong([numFiles]), ' files'
          ]),
          tableName && currentStep === 'done' && h(AccordionHeader, {
            iconShape: 'listAlt',
            title: 'Metadata Tables',
            onClick: () => setCurrentStep('metadata')
          }, [
            tableMetadata?.isUpdate ? 'Updated table ' : 'Created table ',
            strong([code([tableName])]),
            tableMetadata && span([
              ', added or modified ',
              strong(tableMetadata.table.rows.length),
              ' rows'
            ])
          ]),
          Utils.switchCase(currentStep,
            ['workspaces', () => div({
              style: styles.tabPanelHeader
            }, [
              h(WorkspaceSelectorPanel, {
                workspaces: filteredWorkspaces,
                selectedWorkspaceId: workspaceId,
                setCreatingNewWorkspace,
                setWorkspaceId: id => {
                  setWorkspaceId(id)
                  setCurrentStep('collection')
                }
              }, [
                h(NextLink, { step: 'collection', setCurrentStep, stepIsEnabled })
              ])
            ])],
            ['collection', () => div({
              style: styles.tabPanelHeader
            }, [
              workspace && h(CollectionSelectorPanel, {
                workspace,
                selectedCollection: collection,
                setCollection: id => {
                  setCollection(id)
                  setCurrentStep('data')
                }
              }, [
                h(NextLink, { step: 'data', setCurrentStep, stepIsEnabled })
              ])
            ])],
            ['data', () => div({
              style: styles.tabPanelHeader
            }, [
              workspace && collection && h(DataUploadPanel, {
                workspace,
                collection,
                setNumFiles,
                setUploadedFiles: files => {
                  setCurrentStep('metadata')
                }
              }, [
                h(NextLink, { step: 'metadata', setCurrentStep, stepIsEnabled })
              ])
            ])],
            ['metadata', () => div({
              style: styles.tabPanelHeader
            }, [
              workspace && collection && h(MetadataUploadPanel, {
                workspace,
                collection,
                onSuccess: ({ metadata, metadata: { entityType: tableName } }) => {
                  setTableName(tableName)
                  setTableMetadata(metadata)
                  setCurrentStep('done')
                }
              }, [])
            ])],
            ['done', () => div({
              style: styles.tabPanelHeader
            }, [
              h(DonePanel, {
                workspace, collection, tableName, setCurrentStep
              })
            ])]
          )
        ]),
      creatingNewWorkspace && h(NewWorkspaceModal, {
        onDismiss: () => setCreatingNewWorkspace(false),
        onSuccess: ({ namespace, name }) => {
          setWorkspaceId(name)
          refreshWorkspaces()
        }
      }),
      loadingWorkspaces && (!workspaces ? transparentSpinnerOverlay : topSpinnerOverlay)
    ])
  ])
})

export const navPaths = [
  {
    name: 'upload',
    path: '/upload',
    component: UploadData,
    title: `Upload`
  }
]
