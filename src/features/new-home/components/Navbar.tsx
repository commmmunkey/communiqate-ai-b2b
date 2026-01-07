import IconNotification from '../assets/notification_header_black.png';
interface NavbarProps {
	setNoti: (val: boolean) => void;
}

const Navbar = ({ setNoti }: NavbarProps) => {
	const companyLogo = localStorage.getItem('corporate_companylogo') || '';
	return (
		<div className="bg-gray-200 text-white flex justify-between items-center px-4 py-2 ">
			<div className="flex items-center">
				{companyLogo ? <img src={companyLogo} alt="Company Logo" className="h-11" /> : <div className="h-11 w-11 bg-gray-300 rounded" />}
			</div>
			<div className="text-black font-bold">Learning and Development (L&amp;D) Portal</div>
			<div className="flex items-center space-x-4">
				<div className="relative">
					<button className="h-6 w-6 cursor-pointer" onClick={() => setNoti(true)} aria-label="Open notifications">
						<img src={IconNotification} alt="Notification" className="h-6 w-6" />
					</button>
					<span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2"></span>
				</div>
			</div>
		</div>
	);
};

export default Navbar;


