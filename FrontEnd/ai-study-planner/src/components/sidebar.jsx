import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutGrid, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart2, 
  User, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  GraduationCap
} from 'lucide-react';
import Logo from './Logo';

const Sidebar = ({ /* removed activePage */ }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(() => {
    const firstName = localStorage.getItem('firstname');
    const lastName = localStorage.getItem('lastname');
    
    if (firstName || lastName) {
      return {
        firstName: firstName || '',
        lastName: lastName || '',
        fullName: `${firstName || ''} ${lastName || ''}`.trim(),
        initials: firstName && lastName 
          ? `${firstName[0]}${lastName[0]}`.toUpperCase()
          : firstName 
            ? firstName.substring(0, 2).toUpperCase()
            : lastName 
              ? lastName.substring(0, 2).toUpperCase()
              : ''
      };
    }
    return null;
  });

  // Enhanced resize handler with debounce
  useEffect(() => {
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newIsMobile = window.innerWidth < 768;
        setIsMobile(newIsMobile);
        if (newIsMobile) {
          setIsOpen(false);
          setIsMobileMenuOpen(false);
        } else {
          setIsOpen(true);
        }
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Listen for user profile changes
  useEffect(() => {
    const handleProfileUpdate = () => {
      const firstName = localStorage.getItem('firstname');
      const lastName = localStorage.getItem('lastname');
      
      if (firstName || lastName) {
        setUserData({
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: `${firstName || ''} ${lastName || ''}`.trim(),
          initials: firstName && lastName 
            ? `${firstName[0]}${lastName[0]}`.toUpperCase()
            : firstName 
              ? firstName.substring(0, 2).toUpperCase()
              : lastName 
                ? lastName.substring(0, 2).toUpperCase()
                : ''
        });
      } else {
        setUserData(null);
      }
    };

    window.addEventListener('storage', handleProfileUpdate);
    return () => window.removeEventListener('storage', handleProfileUpdate);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutGrid },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/assignments', label: 'Assignments', icon: FileText },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/cwa-analysis', label: 'CWA Analysis', icon: BarChart2 },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const CompactLogo = () => (
    <div className="relative w-8 h-8">
      <GraduationCap className="w-8 h-8 text-blue-600" />
      <Calendar className="w-4 h-4 text-blue-400 absolute -bottom-1 -right-1" />
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0A0F1E] text-white hover:bg-[#1A1F2E] transition-colors"
        aria-label="Toggle mobile menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <div 
        className={`${
          isMobile 
            ? 'fixed left-0 top-0 h-full z-40' 
            : 'sticky top-0 h-screen'
        } ${
          isOpen ? 'w-64' : 'w-20'
        } bg-[#0A0F1E] flex flex-col transition-all duration-300 ease-in-out transform ${
          isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Logo and Toggle Button */}
        <div className={`px-6 py-8 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen ? (
            <Logo />
          ) : (
            <CompactLogo />
          )}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg bg-[#1A1F2E] text-gray-400 hover:text-white hover:bg-[#2A2F3E] transition-colors"
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center ${isOpen ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-[#1A1F2E] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-[#1A1F2E]'
                    }`
                  }
                >
                  <div className="relative">
                    <item.icon className={`w-5 h-5 transition-transform duration-200 ${!isOpen && 'group-hover:scale-110'}`} />
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                  {isOpen && <span className="text-sm transition-opacity duration-200">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 mt-auto border-t border-gray-800">
          <div className={`flex items-center ${isOpen ? 'gap-3 px-4' : 'justify-center'} py-3 group`}>
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                {userData ? userData.initials : <User className="w-4 h-4" />}
              </div>
              {!isOpen && userData && (
                <div className="absolute left-full bottom-0 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {userData.fullName}
                </div>
              )}
            </div>
            {isOpen && (
              <>
                <div className="flex-1">
                  {userData ? (
                    <p className="text-sm text-white font-medium truncate">{userData.fullName}</p>
                  ) : (
                    <NavLink to="/login" className="text-sm text-gray-400 hover:text-white">
                      Sign in
                    </NavLink>
                  )}
                </div>
                {userData && (
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-opacity duration-300 ease-in-out md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default Sidebar;
