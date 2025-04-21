
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { RiDashboardLine, RiSettings4Line, RiHistoryLine, RiFolderLine } from "react-icons/ri";

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    {
      title: "Дашборд",
      icon: <RiDashboardLine className="h-5 w-5" />,
      path: "/",
    },
    {
      title: "История",
      icon: <RiHistoryLine className="h-5 w-5" />,
      path: "/history",
    },
    {
      title: "Группы URL",
      icon: <RiFolderLine className="h-5 w-5" />,
      path: "/groups",
    },
    {
      title: "Настройки",
      icon: <RiSettings4Line className="h-5 w-5" />,
      path: "/settings",
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Индекс Монитор</h1>
        <p className="text-sm text-gray-500">Проверка индексации страниц</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors",
                location.pathname === item.path && "bg-blue-50 text-blue-600"
              )}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            У
          </div>
          <div>
            <p className="text-sm font-medium">Пользователь</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
