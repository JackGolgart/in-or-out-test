import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        <title>In-or-Out</title>
        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;

