import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DigitalCardPage } from './components/card/DigitalCardPage';
import './index.css';
import { initPwa } from './pwa/pwa';

initPwa();

// Un enlace con ?tarjeta=... abre la tarjeta digital pública en lugar de la aplicación.
const cardParam = new URLSearchParams(window.location.search).get('tarjeta');

createRoot(document.getElementById('root')!).render(cardParam ? <DigitalCardPage encoded={cardParam} /> : <App />);
