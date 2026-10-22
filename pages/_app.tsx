import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: "#080c14",
        color: "#f8fafc",
      },
    },
  },
  colors: {
    brand: {
      50: "#e0f7fa",
      100: "#b2ebf2",
      200: "#80deea",
      300: "#4dd0e1",
      400: "#26c6da",
      500: "#00f2fe", // primary accent
      600: "#00b4d8",
      700: "#0077b6",
      800: "#03045e",
      900: "#02033b",
    },
    surface: {
      base: "#080c14",
      card: "#0f1624",
      elevated: "#162033",
      border: "#1e293b",
    },
  },
  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>MotionBird — Real-Time Movement Intelligence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta property="og:title" content="MotionBird — Real-Time Movement Intelligence" />
        <meta
          property="og:description"
          content="Real-time computer-vision fitness movement intelligence platform for tracking exercise performance, repetitions, and form."
        />
        <meta property="og:type" content="website" />
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
