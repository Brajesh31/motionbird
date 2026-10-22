import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#080c14" />
        <meta
          name="description"
          content="MotionBird — Real-time computer-vision fitness movement intelligence platform for tracking exercise performance, repetitions, and form."
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="MotionBird — Real-Time Movement Intelligence" />
        <meta
          property="og:description"
          content="Client-side computer vision fitness coach. Authentic repetition counting, kinematic angle state machines, and real-time form analysis with 100% on-device privacy."
        />
        <meta property="og:image" content="/og-image.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MotionBird — Real-Time Movement Intelligence" />
        <meta
          name="twitter:description"
          content="Client-side computer vision fitness coach. Authentic repetition counting, kinematic angle state machines, and real-time form analysis with 100% on-device privacy."
        />
        <meta name="twitter:image" content="/og-image.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
