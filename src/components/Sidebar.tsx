
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { RiDashboardLine, RiSettings4Line, RiHistoryLine, RiFolderLine, RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri";

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-800">Индекс Монитор</h1>
            <p className="text-sm text-gray-500">Проверка индексации</p>
          </div>
        )}
        <button 
          onClick={toggleSidebar} 
          className="text-gray-500 hover:text-blue-500 transition-colors p-1 rounded-md"
        >
          {isCollapsed ? 
            <RiMenuUnfoldLine className="h-5 w-5" /> : 
            <RiMenuFoldLine className="h-5 w-5" />
          }
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors",
                location.pathname === item.path && "bg-blue-50 text-blue-600"
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>
      
      {!isCollapsed && (
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
      )}
      
      {isCollapsed && (
        <div className="p-4 border-t border-gray-200 flex justify-center">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            У
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
