import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Add any custom meta tags or links here */}
      </Head>
      <body className="h-full bg-[#020617]">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}