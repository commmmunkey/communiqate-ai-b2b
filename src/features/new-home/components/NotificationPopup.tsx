import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/constants';
import Loading from '@/components/Loading';
import IconNotificationItem from '../assets/notification_orange.png';

interface NotificationPopupProps {
	onClose: () => void;
}

const NotificationPopup = ({ onClose }: NotificationPopupProps) => {
	const userId = localStorage.getItem('USER_ID') || '';
	const [notifications, setNotifications] = useState<any[]>([]);
	const [isloading, setIsloading] = useState(false);

	useEffect(() => {
		getNotification();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getNotification = () => {
		setIsloading(true);
		try {
			const dictParameter = JSON.stringify([
				{
					loginuserID: userId,
					languageID: '1',
					page: '0',
					pagesize: '20',
					apiType: 'Android',
					apiVersion: '1.0',
				},
			]);
			fetch(
				`${API_BASE_URL}notification/get-notification-list`,
				{
					method: 'POST',
					headers: new Headers({
						'Content-Type': 'application/x-www-form-urlencoded',
					}),
					body: 'json=' + dictParameter,
				}
			)
				.then((response) => response.json())
				.then((responseJson) => {
					if (responseJson[0]?.data) {
						setNotifications(responseJson[0].data);
					}
					setIsloading(false);
				});
		} catch (error) {
			setIsloading(false);
			console.error('Error in Fetching notifications', error);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
			<div className="bg-white p-6 relative rounded-lg w-full max-w-lg">
				<button className="absolute top-0 right-0 mt-4 mr-4 text-lg font-semibold" onClick={onClose}>
					X
				</button>
				{isloading ? (
					<Loading message={'Processing your request...'} />
				) : (
					<div className="overflow-y-auto max-h-80 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
						{notifications.map((notification, index) => (
							<div key={index} className="flex border-b border-gray-200 p-4 items-start">
								<img src={IconNotificationItem} alt="icon" className="h-6 w-6 mr-4" />
								<div>
									<p className="font-semibold">{notification.notificationMessageText}</p>
									<p className="text-sm opacity-50">
										{notification.notificationSendDate} {String(notification.notificationSendTime).slice(0, 5)}
									</p>
								</div>
							</div>
						))}
						<style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
					</div>
				)}
			</div>
		</div>
	);
};

export default NotificationPopup;


