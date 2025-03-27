import SideBar from "./Sidebar"
import HeaderAdmin from "./HeaderAdmin"
import { Toaster } from "@/components/ui/toaster";
function LayoutAdmin ({ children }: { children: JSX.Element }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SideBar />
      <div className="flex flex-col">
        <HeaderAdmin />
        
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-100">
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  )
}

export default LayoutAdmin;
