import ReactDOM from 'react-dom/client'
import reportWebVitals from './reportWebVitals'
import App from "./App"
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import theme from '../src/components/theme'
import { Provider } from 'react-redux'
import store from 'components/redux/store.js'
import { registerSW } from 'virtual:pwa-register'
import { SpeedInsights } from "@vercel/speed-insights/react"

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
    <ChakraProvider theme={theme}>
        <SpeedInsights />
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Provider store={store}>
            <App />
        </Provider>

    </ChakraProvider>
)

reportWebVitals()
registerSW({immediate: true})