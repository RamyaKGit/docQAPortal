import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Doctor QA Portal - Document Q&A (RAG)',
  description: 'Add documents and ask questions powered by OpenAI and Pinecone vector store.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <nav className="nav">
            <div className="logo">
              🩺 Doctor QA Portal
            </div>
            <div className="nav-links">
              <Link href="/docs" className="nav-link" id="nav-docs">
                Docs
              </Link>
              <Link href="/ask" className="nav-link" id="nav-ask">
                Ask
              </Link>
            </div>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
