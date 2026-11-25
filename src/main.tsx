import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DigitalCardPage } from './components/card/DigitalCardPage';
import { TiendlyVideoPage } from './components/video/TiendlyVideoPage';
import './index.css';
import { initPwa } from './pwa/pwa';

initPwa();

// Un enlace con ?tarjeta=... abre la tarjeta digital pública en lugar de la aplicación.
const params = new URLSearchParams(window.location.search);
const cardParam = params.get('tarjeta');
// Un enlace con ?video=tiendly o ?video=reservasia abre la página pública con el video de esa solución.
const videoParam = params.get('video');

createRoot(document.getElementById('root')!).render(
  cardParam ? <DigitalCardPage encoded={cardParam} /> : videoParam === 'tiendly' || videoParam === 'reservasia' ? <TiendlyVideoPage solution={videoParam} /> : <App />
);
