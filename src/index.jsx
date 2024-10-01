import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import App from "./App";
import {ChakraProvider, ColorModeScript} from '@chakra-ui/react'
import theme from '../src/components/theme'
import { Provider } from 'react-redux';
import store from 'components/redux/store.js';
const root = ReactDOM.createRoot(document.getElementById('root'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(error => {
          console.error('SW registration failed:', error);
          alert('Service Worker registration failed. The app may not work offline.');
        });
  });
}

root.render(
    <ChakraProvider theme={theme}>

    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <Provider store={store}>
    <App />
    </Provider>
    </ChakraProvider>
);
reportWebVitals();
