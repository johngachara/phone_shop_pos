import ReactDOM from 'react-dom/client'
import reportWebVitals from './reportWebVitals'
import App from "./App"
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import theme from '../src/components/theme'
import { Provider } from 'react-redux'
import store from 'components/redux/store.js'
import { registerSW } from 'virtual:pwa-register'


const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
    <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
                <App />
    </ChakraProvider>
)

reportWebVitals()
registerSW()