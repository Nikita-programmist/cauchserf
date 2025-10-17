import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

import { BRAND } from "../lib/brand";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" />
        <meta name="theme-color" content={BRAND.colors.primary} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
