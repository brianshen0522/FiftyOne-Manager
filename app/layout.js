export const metadata = {
  title: 'FiftyOne Manager'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
