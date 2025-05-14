import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>In-or-Out</title>
        <link rel="icon" href="/basketball.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/basketball.svg" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;

