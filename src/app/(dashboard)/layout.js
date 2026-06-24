import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-np-cream)]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile spacer — pushes content below the fixed mobile top bar */}
        <div className="lg:hidden h-14 flex-shrink-0" />

        {/* Desktop top bar — sits in the content column, right of the sidebar */}
        <TopBar />

        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
