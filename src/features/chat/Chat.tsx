import React, { useState, useEffect } from 'react';
import { environment } from './environment';
import commenterIcon from './commenter_icon_circular.png';
import sendIcon from './send.png';

interface Message {
    userID: number;
    userFirstName: string;
    userProfilePicture: string | null;
    monkchatmessMessage: string;
    monkchatmessCreatedDateTime: string;
}

const Chat = () => {
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

    const [messages, setMessages] = useState<Message[]>([]);
    const userId = parseInt(localStorage.getItem('USER_ID') ?? '0', 10);
    const monkchatID = localStorage.getItem('monkchatID');
    const monkcatName = localStorage.getItem('monkcatName');
    const monkchatSubject = localStorage.getItem('monkchatSubject');
    const [txtComment, setTxtComment] = useState('');

    useEffect(() => {
        getMonkMessageApi();
    }, []);

    const addCommentApi = () => {
        try {
            let dictParameter = JSON.stringify(
                [{
                    "loginuserID": userId,
                    "languageID": "1",
                    "monkchatID": monkchatID,
                    "monkchatmessMessage": txtComment,
                    "monkchatmessAttachment": "",
                    "page": "0",
                    "pagesize": "50",
                    "apiType": "Android",
                    "apiVersion": "1.0"
                }]

            );

            fetch(environment.production ? environment.apiBaseUrl + "forum/monkchat-add-message" : "/api/forum/monkchat-add-message", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'json=' + encodeURIComponent(dictParameter)
            })
                .then(response => response.json())
                .then(responseJson => {
                    if (responseJson[0].status === "true") {
                        setMessages(responseJson[0].data);
                    }
                    setTxtComment('');
                })
                .catch(error => {
                    console.error("Error fetching forum/monkchat-add-message:", error);
                });
        } catch (error) {
            console.error("Exception in forum/monkchat-add-message", error);
        }
    };

    const getMonkMessageApi = () => {
        try {
            let dictParameter = JSON.stringify([{
                "loginuserID": userId,
                "languageID": "1",
                "monkchatID": monkchatID,
                "page": "0",
                "pagesize": "50",
                "apiType": "Android",
                "apiVersion": "1.0"
            }]);

            fetch(environment.production ? environment.apiBaseUrl + "forum/get-monkchat-message" : "/api/forum/get-monkchat-message", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'json=' + encodeURIComponent(dictParameter)
            })
                .then(response => response.json())
                .then(responseJson => {
                    if (responseJson[0].status === "true") {
                        setMessages(responseJson[0].data);
                    }
                })
                .catch(error => {
                    console.error("Error fetching forum/get-monkchat-message:", error);
                });
        } catch (error) {
            console.error("Exception in forum/get-monkchat-message", error);
        }
    };

    const messageClass = (messageUserId: number) => {
        return messageUserId === userId ? "ml-auto bg-blue-200" : "bg-gray-200";
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center">
                <h1 className="flex-grow font-bold">{monkcatName} - {monkchatSubject}</h1>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`p-4 rounded-lg mb-4 max-w-lg ${messageClass(msg.userID)}`}>
                        <div className="flex items-center">
                            <img src={(msg.userProfilePicture === null || msg.userProfilePicture === '') ? commenterIcon : `https://stage.englishmonkapp.com/englishmonk-staging//backend/web/uploads/users/${msg.userProfilePicture}`} alt="User" className="h-8 w-8 mr-2" />
                            <div className="flex-grow">
                                <h2 className="text-lg font-semibold">{msg.userID === userId ? "You" : msg.userFirstName}</h2>
                                <p>{msg.monkchatmessMessage}</p>
                            </div>
                            <span className="text-xs">{msg.monkchatmessCreatedDateTime}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 flex items-center space-x-2">
                <input type="text" placeholder="Post your comment" value={txtComment} onChange={(e) => { setTxtComment(e.target.value) }} className="border p-3 flex-grow" />
                <img src={sendIcon} alt="Chat" className="h-8 w-8 cursor-pointer" onClick={addCommentApi} />
            </div>
        </div>
    );
};

export default Chat;

