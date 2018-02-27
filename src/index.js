import ReactDOM from 'react-dom'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'


ReactDOM.render(App({ title: 'Saturn' }),
  document.getElementById('root'))
registerServiceWorker()
