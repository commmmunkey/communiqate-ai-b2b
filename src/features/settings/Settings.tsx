import React, { useState, useEffect } from 'react';
import { environment } from './environment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import arrowRightOrange from './arrow_right_orange.png';

interface NotificationToggleProps {
    label: string;
    state: boolean;
    setState: (value: boolean) => void;
}

const NotificationToggle = ({ label, state, setState }: NotificationToggleProps) => {
    return (
        <div className="flex justify-between items-center">
            <p>{label}</p>
            <input type="checkbox" checked={state} onChange={() => setState(!state)} />
        </div>
    );
};

const Settings = () => {
    useEffect(() => {
        // Fetch and set theme colors from localStorage or API here
        const primaryColor = localStorage.getItem("corporate_primary_color") || '#0000ff';
        const secondaryColor = localStorage.getItem("corporate_secondary_color") || '#f5914a';
        const backgroundColor = localStorage.getItem("corporate_background_color") || '#fddaa7';
        const accentColor = localStorage.getItem("corporate_accent_color") || '#e0d4bc';

        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
        document.documentElement.style.setProperty('--background-color', backgroundColor);
        document.documentElement.style.setProperty('--accent-color', accentColor);
    }, []);

    const userId = localStorage.getItem('USER_ID');
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Notification states
    const [testsNotify, setTestsNotify] = useState(true);
    const [resultsNotify, setResultsNotify] = useState(true);
    const [newsNotify, setNewsNotify] = useState(true);
    const [eventsNotify, setEventsNotify] = useState(true);
    const [noticesNotify, setNoticesNotify] = useState(true);
    const [adminAnnouncementsNotify, setAdminAnnouncementsNotify] = useState(true);

    useEffect(() => {
        // Assume this function fetches settings from server and updates local state
        getNotificationSettingApi();
    }, []);

    const openNotificationSettings = () => {
        setShowModal(true);
    };

    const closeNotificationSettings = () => {
        setShowModal(false);
    };

    const handleUpdateNotifications = () => {
        setIsLoading(true);
        let dictParameter = JSON.stringify([{
            "loginuserID": userId,
            "userTestNotify": testsNotify ? "Yes" : "No",
            "userResultNotify": resultsNotify ? "Yes" : "No",
            "userNewsNotify": newsNotify ? "Yes" : "No",
            "userEventsNotify": eventsNotify ? "Yes" : "No",
            "userNoticeNotify": noticesNotify ? "Yes" : "No",
            "userAdminNotify": adminAnnouncementsNotify ? "Yes" : "No",
            "apiType": "Android",
            "apiVersion": "1.0",
            "languageID": "1"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "users/user-update-settings" : "/api/users/user-update-settings", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(responseJson => {
                // console.log("Settings updated: ", JSON.stringify(responseJson));
                setIsLoading(false);
                toast.info("Your settings have been successfully updated.", {
                    position: "top-center",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
                closeNotificationSettings();
            })
            .catch(error => {
                toast.error("Failed to update settings.", {
                    position: "top-center",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
                console.error("Error updating settings: ", error);
                setIsLoading(false);
            });
    };

    const getNotificationSettingApi = () => {
        // Simulate API call to fetch settings
        // console.log("Fetching settings...");
        setIsLoading(true);
        // Simulate setting state based on fetched values
        setTimeout(() => {
            setIsLoading(false);
            // console.log("Settings fetched");
        }, 1000);
    };

    return (
        <div className="flex flex-col min-h-screen max-w-screen-md mx-auto">
            {/* Header */}
            <div className="bg-primary px-4 py-3 text-white text-center">
                <h1 className="text-xl font-bold">Settings</h1>
            </div>

            {/* Body - Centered Content */}
            <div className="flex-grow flex items-center justify-center">
                <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md cursor-pointer" onClick={openNotificationSettings}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Notification alerts</h2>
                        <button className="flex items-center justify-center">
                            <img src={arrowRightOrange} alt="Next" className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-600">Control the notification alerts.</p>
                </div>
            </div>

            {/* Notification Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                        <div className="sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="button" onClick={closeNotificationSettings} className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                Close
                            </button>
                        </div>
                        <h3 className="text-xl font-bold mb-4">Update Notifications</h3>
                        <div className="space-y-4">
                            <NotificationToggle label="Tests" state={testsNotify} setState={setTestsNotify} />
                            <NotificationToggle label="Results" state={resultsNotify} setState={setResultsNotify} />
                            <NotificationToggle label="News" state={newsNotify} setState={setNewsNotify} />
                            <NotificationToggle label="Events" state={eventsNotify} setState={setEventsNotify} />
                            <NotificationToggle label="Notices" state={noticesNotify} setState={setNoticesNotify} />
                            <NotificationToggle label="Admin Announcements" state={adminAnnouncementsNotify} setState={setAdminAnnouncementsNotify} />
                        </div>
                        <button onClick={handleUpdateNotifications} className="mt-6 w-full bg-primary text-white p-2 rounded-lg">
                            Update
                        </button>
                    </div>
                </div>
            )}
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
        </div>
    );
};

export default Settings;

