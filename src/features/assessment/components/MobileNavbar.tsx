import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

interface MobileNavbarProps {
    setShowLogoutDialog: (show: boolean) => void;
}

const MobileNavbar = ({ setShowLogoutDialog }: MobileNavbarProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const userName = localStorage.getItem('USER_NAME');
    const companyLogo = localStorage.getItem("corporate_companylogo");
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        setShowLogoutDialog(false);
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="bg-gray-200 text-white flex justify-between items-center px-4 py-2 md:hidden">
                {/* Company Logo */}
                <div className="flex items-center">
                    {companyLogo && <img src={companyLogo} alt="Company Logo" className="h-8" />}
                </div>

                <div className='text-black font-bold text-sm'>L&D Portal</div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="text-black p-2"
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMenu}></div>
                    <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 text-white shadow-lg transform transition-transform duration-300 ease-in-out">
                        {/* Close Button */}
                        <div className="flex justify-end p-4">
                            <button
                                onClick={closeMenu}
                                className="text-white p-2 hover:bg-gray-700 rounded"
                                aria-label="Close menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* User Profile */}
                        <div className="px-4 pb-4 border-b border-gray-700">
                            <Link to="/profile" className="flex items-center hover:bg-gray-700 p-2 rounded" onClick={closeMenu}>
                                <div className='flex flex-col text-primary'>
                                    <div className="text-sm">Hi!</div>
                                    <div className='font-bold text-sm'>{userName || 'User'}</div>
                                </div>
                            </Link>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="flex-1 px-4 py-4">
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/assessment" className="flex items-center py-3 px-3 hover:bg-gray-700 rounded text-white" onClick={closeMenu}>
                                        Assessment Tool
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileNavbar;


