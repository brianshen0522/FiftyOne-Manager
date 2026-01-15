import HelpButton from './_components/HelpButton';
import ClientProviders from './_components/ClientProviders';

export const metadata = {
  title: 'FiftyOne Manager'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant-TW">
      <body>
        <ClientProviders>
          {children}
          <HelpButton />
        </ClientProviders>
      </body>
    </html>
  );
}
