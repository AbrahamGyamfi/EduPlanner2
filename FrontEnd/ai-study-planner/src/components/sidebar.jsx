import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNavigationLoading } from '../contexts/NavigationLoadingContext';
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
  GraduationCap,
  Brain
} from 'lucide-react';
import Logo from './Logo';

const Sidebar = ({ onLogout }) => {
  const { navigateWithLoading } = useNavigationLoading();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState(() => {
    const firstName = localStorage.getItem('firstname');
    const lastName = localStorage.getItem('lastname');
    
    return {
      firstName: firstName || '',
      lastName: lastName || '',
      displayName: firstName || '',  // Show only first name
      initials: firstName && lastName 
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : firstName 
          ? firstName.substring(0, 2).toUpperCase()
          : lastName 
            ? lastName.substring(0, 2).toUpperCase()
            : 'US'
    };
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
      
      setUserData({
        firstName: firstName || '',
        lastName: lastName || '',
        displayName: firstName || '',  // Show only first name
        initials: firstName && lastName 
          ? `${firstName[0]}${lastName[0]}`.toUpperCase()
          : firstName 
            ? firstName.substring(0, 2).toUpperCase()
            : lastName 
              ? lastName.substring(0, 2).toUpperCase()
              : 'US'
      });
    };

    window.addEventListener('storage', handleProfileUpdate);
    return () => window.removeEventListener('storage', handleProfileUpdate);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutGrid },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/assignments', label: 'Assignments', icon: FileText },
    { path: '/knowledge-check', label: 'Knowledge', icon: Brain },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/performance-analysis', label: 'Analytics', icon: BarChart2 },
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
    <div className="relative w-10 h-10">
      <GraduationCap className="w-10 h-10 text-blue-600" />
      <Calendar className="w-5 h-5 text-blue-400 absolute -bottom-1 -right-1" />
    </div>
  );

  const handleNavigation = async (path, label) => {
    try {
      if (isMobile) {
        setIsMobileMenuOpen(false);
      }
      await navigateWithLoading(
        path,
        { replace: true },
        `Loading ${label}...`,
        'Please wait while we prepare your page'
      );
    } catch (error) {
      console.error('Navigation error:', error);
      // toast.error('Failed to navigate. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      // Use the logout handler passed from App component
      if (onLogout) {
        onLogout();
      } else {
        // Fallback: Clear all user-related data locally
        ['isAuthenticated', 'token', 'firstname', 'lastname', 'email', 'userId', 'isLoggedIn', 'user'].forEach(key => {
          localStorage.removeItem(key);
        });
      }
      
      await navigateWithLoading(
        '/login', 
        { replace: true }, 
        'Logging out...', 
        'See you soon!'
      );
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate directly as fallback
      navigate('/login', { replace: true });
    }
  };

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
            <Logo size="small" />
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
                <button
                  onClick={() => handleNavigation(item.path, item.label)}
                  className={`w-full flex items-center ${isOpen ? 'gap-3' : 'justify-center'} px-4 py-3 rounded-lg transition-all duration-200 group overflow-hidden ${
                    location.pathname === item.path
                      ? 'bg-[#1A1F2E] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#1A1F2E]'
                  }`}
                >
                  <div className="relative">
                    <item.icon className={`w-5 h-5 transition-transform duration-200 ${!isOpen && 'group-hover:scale-110'}`} />
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                  {isOpen && <span className="text-sm transition-opacity duration-200 truncate">{item.label}</span>}
                </button>
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
                  {userData.displayName}
                </div>
              )}
            </div>
            {isOpen && (
              <>
                <div className="flex-1">
                  {userData ? (
                    <p className="text-sm text-white font-medium truncate">{userData.displayName}</p>
                  ) : (
                    <button 
                      onClick={() => handleNavigation('/login', 'Login')}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Sign in
                    </button>
                  )}
                </div>
                {userData && (
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={handleLogout}
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
