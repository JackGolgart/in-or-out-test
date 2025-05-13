import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../lib/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>NBA Picks</title>
        <link rel="icon" href="/basketball.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/basketball.svg" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;

