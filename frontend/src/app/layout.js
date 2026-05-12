import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AppProvider } from '../context/AppContext';

export const metadata = {
  title: 'Zitterbewegung Engine Lite v6.0',
  description:
    'Simulador científico del Efecto Zitterbewegung — Juan Gallardo · IUB 2026',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head />
      <body>
        <AppProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded"
          >
            Saltar al contenido principal
          </a>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
