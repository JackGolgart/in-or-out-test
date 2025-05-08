import Head from 'next/head';
import '../styles/globals.css'; // adjust if you use a different global stylesheet

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>NBA Picks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/basketball.svg" type="image/svg+xml" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
