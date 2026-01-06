// src/layouts/SidebarLayout.jsx
import Sidebar from '../components/Sidebar';
// src/layouts/SidebarLayout.jsx
import Topbar from '../components/Topbar';


export default function SidebarLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
