import Head from 'next/head';
import '../styles/globals.css';
import { AuthProvider } from '../lib/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>NBA Picks</title>
        <link rel="icon" href="/basketball.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;

