import React, { useEffect, useState } from 'react';
import { environment } from './environment';
import FeedbackModal from './FeedbackModal';
import NoRecordView from './NoRecordView';
import Loading from './Loading';
import feedbackUserIcon from './feedback_user_icon_circular.png';
import addFeedbackBtn from './add_feedback_btn.png';

interface FeedbackItem {
    feedbackName: string;
    feedbackFeedback: string;
    feedbackDate: string;
}

interface UserData {
    userFirstName: string;
    userEmail: string;
}

const Feedback = () => {
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
    const userDataString = localStorage.getItem('USER_DATA');
    // Parse the string back into an object
    const userData: UserData | null = userDataString ? JSON.parse(userDataString) : null;
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [isloading, setIsloading] = useState(false);
    const [newFeedback, setNewFeedback] = useState('');

    useEffect(() => {
        getFeedbackListApi();
    }, []);

    const getFeedbackListApi = () => {
        setIsloading(true);
        let dictParameter = JSON.stringify([{
            "loginuserID": userId,
            "languageID": "1",
            "page": "0",
            "pagesize": "50",
            "apiType": "Android",
            "apiVersion": "1.0"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "feedback/get-feedback-list" : "/api/feedback/get-feedback-list", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson[0].status === "true") {
                    setFeedbackList(responseJson[0].data);
                }
                setIsloading(false);
            })
            .catch(error => {
                setIsloading(false);
                console.error("Error fetching get-feedback data:", error);
            });
    };

    const toggleModal = () => {
        setShowModal(!showModal);
    };

    const handleFeedbackSubmit = () => {
        setIsloading(true);
        // console.log("Submitting feedback:", newFeedback);
        if (!userData) {
            setIsloading(false);
            return;
        }
        let dictParameter = JSON.stringify([{
            "loginuserID": userId,
            "languageID": "1",
            "feedbackName": userData.userFirstName,
            "feedbackEmail": userData.userEmail,
            "feedbackFeedback": newFeedback,
            "apiType": "Android",
            "apiVersion": "1.0"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "feedback/add-feedback" : "/api/feedback/add-feedback", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(responseJson => {
                if (responseJson[0].status === "true") {
                    getFeedbackListApi();
                    setNewFeedback('');
                    setShowModal(false);
                }
                setIsloading(false);
            })
            .catch(error => {
                setIsloading(false);
                console.error("Error fetching feedback/add-feedback:", error);
            });
    };

    return (
        isloading ?
            <Loading message={"Processing your request..."} /> :
            <div className="flex flex-col min-h-screen relative max-w-screen-md mx-auto">
                {/* Header */}
                <div className="bg-primary text-white px-4 py-2 flex items-center justify-center">
                    <h1 className="text-xl font-bold">Feedback</h1>
                </div>

                {/* Feedback List */}
                {feedbackList.length <= 0 ?
                    <NoRecordView />
                    : <div className="flex-grow overflow-y-auto">
                        {feedbackList.map((feedback, index) => (
                            <div key={index} className="bg-white p-4 border-b border-gray-200 flex items-center">
                                <img src={feedbackUserIcon} alt="User" className="h-10 w-10 mr-4" />
                                <div>
                                    <h2 className="text-lg font-semibold">{feedback.feedbackName}</h2>
                                    <p className="text-sm">{feedback.feedbackFeedback}</p>
                                    <span className="text-xs text-gray-500">{new Date(feedback.feedbackDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>}

                {/* Floating Action Button */}
                <button onClick={toggleModal} className="rounded-full fixed right-4 bottom-4 shadow-lg">
                    <img src={addFeedbackBtn} alt="Add Feedback" className="h-11 w-11" />
                </button>
                <FeedbackModal
                    isOpen={showModal}
                    onClose={toggleModal}
                    onSubmit={handleFeedbackSubmit}
                    feedback={newFeedback}
                    setFeedback={setNewFeedback}
                />
            </div>
    );
};

export default Feedback;

