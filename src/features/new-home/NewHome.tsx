import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/store';
import { environment } from './environment';
import HomeListView from './components/HomeListView';
import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import NotificationPopup from './components/NotificationPopup';

interface LessonUnit {
	[key: string]: any;
	skillscategory?: string;
	courseType?: 'corporate' | 'free' | 'premium';
}

const NewHome = () => {
	useEffect(() => {
		const primaryColor = localStorage.getItem('corporate_primary_color') || '#0000ff';
		const secondaryColor = localStorage.getItem('corporate_secondary_color') || '#f5914a';
		const backgroundColor = localStorage.getItem('corporate_background_color') || '#fddaa7';
		const accentColor = localStorage.getItem('corporate_accent_color') || '#e0d4bc';

		document.documentElement.style.setProperty('--primary-color', primaryColor);
		document.documentElement.style.setProperty('--secondary-color', secondaryColor);
		document.documentElement.style.setProperty('--background-color', backgroundColor);
		document.documentElement.style.setProperty('--accent-color', accentColor);
	}, []);

	const {
		arrFreeCourseHome,
		setArrFreeCourseHome,
		arrCorporateCourseHome,
		setArrCorporateCourseHome,
		arrPremiumCourseHome,
		setArrPremiumCourseHome,
		setArrHomeBanners,
	} = useStore();

	const userId = localStorage.getItem('USER_ID');
	const [isNotificationPopup, setIsNotificationPopup] = useState(false);
	const [cutoffMessage, setCutoffMessage] = useState('');
	const navigate = useNavigate();

	// console.log('=== NEWHOME STATE DEBUG ===');
	// console.log('arrCorporateCourseHome:', arrCorporateCourseHome);
	// console.log('arrFreeCourseHome:', arrFreeCourseHome);
	// console.log('arrPremiumCourseHome:', arrPremiumCourseHome);
	// console.log('cutoffMessage:', cutoffMessage);

	const groupedBySkillsCategory = useMemo(() => {
		const allLUs: LessonUnit[] = [];
		if (arrCorporateCourseHome) {
			arrCorporateCourseHome.forEach((item: any) => {
				allLUs.push({ ...item, courseType: 'corporate' });
			});
		}
		if (arrFreeCourseHome) {
			arrFreeCourseHome.forEach((item: any) => {
				allLUs.push({ ...item, courseType: 'free' });
			});
		}
		if (arrPremiumCourseHome) {
			arrPremiumCourseHome.forEach((item: any) => {
				allLUs.push({ ...item, courseType: 'premium' });
			});
		}
		const grouped: Record<string, LessonUnit[]> = {};
		allLUs.forEach((item) => {
			const category = item.skillscategory || 'Other';
			if (!grouped[category]) grouped[category] = [];
			grouped[category].push(item);
		});
		return grouped;
	}, [arrCorporateCourseHome, arrFreeCourseHome, arrPremiumCourseHome]);

	useEffect(() => {
		// console.log('userId', userId);
		if (userId !== null && userId !== undefined && userId !== '0') {
			getHomeCourses();
			getHomeBanners();
		} else {
			navigate('/login');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const getHomeBanners = () => {
		try {
			const dictParameter = JSON.stringify([
				{
					loginuserID: userId,
					userType: 'Customer',
					languageID: '1',
					page: '0',
					pagesize: '20',
					apiType: 'Android',
					apiVersion: '1.0',
				},
			]);
			fetch(
				environment.production
					? environment.apiBaseUrl + 'users/user-home'
					: '/api/users/user-home',
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
					setArrHomeBanners(responseJson[0]?.banners ?? []);
					// console.log('banners', responseJson[0]?.banners);
				});
		} catch (error) {
			console.error('Error in Fetching home banners', error);
		}
	};

	const getHomeCorporateCourses = () => {
		try {
			const dictParameter = JSON.stringify([
				{
					loginfacultyID: userId,
					languageID: '1',
					page: '0',
					pagesize: '500',
					apiType: 'Android',
					apiVersion: '1.0',
				},
			]);
			fetch(
				'https://stage.englishmonkapp.com/englishmonk-staging//backend/web/index.php/v1/faculty/get-faculty-practice-test3',
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
					setArrCorporateCourseHome(responseJson[0]?.corporate ?? []);
					// console.log('corporate', responseJson);
				});
		} catch (error) {
			console.error('Error in Fetching corporate courses', error);
		}
	};

	const getHomeCourses = () => {
		try {
			const dictParameter = JSON.stringify([
				{
					loginuserID: userId,
					languageID: '1',
					apiType: 'Android',
					apiVersion: '1.0',
				},
			]);
			fetch(
				'https://stage.englishmonkapp.com/englishmonk-staging//backend/web/index.php/v1/faculty/get-homepage-lus',
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
					setArrFreeCourseHome(responseJson[0]?.free ?? []);
					setArrPremiumCourseHome(responseJson[0]?.premium ?? []);
					// console.log('cutoff', responseJson[0]?.cutoff);
					if (responseJson[0]?.cutoff == null) {
						setCutoffMessage(
							'Assessment has to be taken in order to view the content of this page'
						);
					} else {
						setCutoffMessage('');
					}
					getHomeCorporateCourses();
					// console.log('free', responseJson);
				});
		} catch (error) {
			console.error('Error in Fetching home courses', error);
		}
	};

	return (
		<>
			{/* Mobile Navigation */}
			<MobileNavbar setShowLogoutDialog={() => {}} />

			{/* Desktop Navigation */}
			<div className="hidden md:block">
				<Navbar setNoti={setIsNotificationPopup} />
			</div>

			{cutoffMessage && (
				<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 m-4 rounded max-w-screen-lg mx-auto">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm">{cutoffMessage}</p>
						</div>
					</div>
				</div>
			)}

			{!cutoffMessage &&
				Object.entries(groupedBySkillsCategory).map(([category, items]) => (
					<div key={category}>
						{items.map((item, index) => (
							<HomeListView
								key={`${category}-${index}`}
								item={item}
								isFree={(item as LessonUnit).courseType === 'free'}
								showSkillCategory={true}
							/>
						))}
					</div>
				))}

			{isNotificationPopup && <NotificationPopup onClose={() => setIsNotificationPopup(false)} />}
		</>
	);
};

export default NewHome;


