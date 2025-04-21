
import React from "react";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="container mx-auto max-w-6xl">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default Layout;
