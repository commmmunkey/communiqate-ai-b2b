import React, { useEffect, useState } from 'react';
import { environment } from './environment';
import NoRecordView from './NoRecordView';
import logoAboutUs from './logo_about_us.png';
import contactEmail from './contact_email.png';
import contactCall from './contact_call.png';
import arrowRightOrange from './arrow_right_orange.png';

interface FaqType {
    faqtypeID: number;
    faqtypeName: string;
}

interface FaqDetail {
    faqQuestion: string;
    faqAnswer: string;
}

interface MenuItemProps {
    title: string;
    onClick: () => void;
}

const MoreInfo = () => {
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
    const [isPopupVisible, setPopupVisible] = useState(false);
    const [popupContent, setPopupContent] = useState('');
    const [pageTitle, setPageTitle] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [faqTypes, setFaqTypes] = useState<FaqType[]>([]);
    const [isDetailsPopupVisible, setDetailsPopupVisible] = useState(false);
    const [faqDetails, setFaqDetails] = useState<FaqDetail[]>([]);

    useEffect(() => {
        getsettings();
    }, []);

    const handleFaqTypeClick = (faqTypeId: number) => {
        fetchFaqDetails(faqTypeId);
    };

    const fetchFaqDetails = (faqTypeId: number) => {
        let dictParameter = JSON.stringify([{
            "languageID": "1",
            "faqtypeID": faqTypeId,
            "apiVersion": "1.0",
            "apiType": "Android"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "faq/faq-list" : "/api/faq/faq-list", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(responsedata => {
                setFaqDetails(responsedata[0].data);
                setDetailsPopupVisible(true);
            })
            .catch(error => {
                console.error("Error fetching FAQ details:", error);
            });
    };

    const getsettings = () => {
        let dictParameter = JSON.stringify([{
            "loginuserID": userId,
            "languageID": "1",
            "apiType": "Android",
            "apiVersion": "1.0"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "settings/get-user-settings" : "/api/settings/get-user-settings", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(responsedata => {
                setEmail(responsedata[0].data[0].settingsSupportEmail);
                setPhone(responsedata[0].data[0].settingsSupportNo);
            })
            .catch(error => {
                console.error("Error fetching get-feedback data:", error);
            });
    };

    const handleClick = (title: string) => {
        if (title === "Privacy Policy") {
            setPageTitle("Privacy Policy");
            getCMSDataApi("privacypolicy");
        }
        else if (title === "Terms & Conditions") {
            setPageTitle("Terms & Conditions");
            getCMSDataApi("tnc");
        }
        else if (title === "About Us") {
            setPageTitle("About Us");
            getCMSDataApi("aboutus");
        }
        else if (title === "Contact") {
            setPageTitle("Contact");
            getCMSDataApi("contactus");
        } else {
            setPageTitle("FAQs");
            getFaqTypes();
        }
    };

    const getFaqTypes = () => {
        let dictParameter = JSON.stringify([{
            "languageID": "1",
            "apiType": "Android",
            "apiVersion": "1.0"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "faq/get-faqtype-list" : "/api/faq/get-faqtype-list", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(responsedata => {
                setFaqTypes(responsedata[0].data);
                setPopupVisible(true);
            })
            .catch(error => {
                console.error("Error fetching get-feedback data:", error);
            });
    };

    const getCMSDataApi = (pagename: string) => {
        let dictParameter = JSON.stringify([{
            "loginuserID": userId,
            "languageID": "1",
            "cmspageConstantCode": pagename,
            "apiType": "Android",
            "apiVersion": "1.0"
        }]);

        fetch(environment.production ? environment.apiBaseUrl + "cmspage/get-cmspage" : "/api/cmspage/get-cmspage", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'json=' + encodeURIComponent(dictParameter)
        })
            .then(response => response.json())
            .then(data => {
                setPopupContent(data[0].data[0].cmspageContents);
                setPopupVisible(true);
            })
            .catch(error => {
                console.error("Error fetching get-feedback data:", error);
            });
    };

    const handleClosePopup = () => {
        setPopupVisible(false);
    };

    const FaqDetailsPopup = () => (
        <div className="fixed inset-0 z-30 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>

                {/* Modal content */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full p-6">
                    {faqDetails.map((faq, index) => (
                        <div key={index} className="mt-4 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-primary">
                                {faq.faqQuestion}
                            </h3>
                            <div dangerouslySetInnerHTML={{ __html: faq.faqAnswer }} className="mt-2 text-sm text-gray-500"></div>
                        </div>
                    ))}
                    {faqDetails.length <= 0 &&
                        <NoRecordView />}

                    <div className="mt-5 sm:mt-6">
                        <button type="button" onClick={() => setDetailsPopupVisible(false)}
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const Popup = () => (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="button" onClick={handleClosePopup} className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                Close
                            </button>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            {/* Conditional rendering for Contact information */}
                            {pageTitle === "FAQs" ? (
                                <div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {pageTitle}
                                    </h3>
                                    <ul className="mt-2">
                                        {faqTypes.map(faqType => (
                                            <li key={faqType.faqtypeID} className="mt-2 border border-gray-200 rounded p-2 flex justify-between cursor-pointer" onClick={() => handleFaqTypeClick(faqType.faqtypeID)}>
                                                {faqType.faqtypeName}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) :
                                pageTitle === "Contact" ? (
                                    <div className="flex flex-col items-center mt-4">
                                        <div className="flex justify-center items-center">
                                            <img src={logoAboutUs} alt="Logo" className="h-14 w-15" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-4">We are here to help You!</h3>

                                        <div>
                                            <div className="flex items-center">
                                                <img src={contactEmail} alt="Email" className="h-6 w-6 mr-2" />
                                                <div>
                                                    <p>For support related queries, mail to</p>
                                                    <a href={`mailto:${email}`} className="text-primary">{email}</a>
                                                </div>
                                            </div>
                                            <div className="flex items-center mt-4">
                                                <img src={contactCall} alt="Phone" className="h-6 w-6 mr-2" />
                                                <div>
                                                    <p>Talk with our expert on the below number</p>
                                                    <a href={`tel:${phone}`} className="text-primary">{phone}</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <React.Fragment>
                                        {/* Image section */}
                                        <div className="flex justify-center items-center">
                                            <img src={logoAboutUs} alt="Logo" className="h-14 w-15" />
                                        </div>
                                        {/* Title section */}
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                                            {pageTitle}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: popupContent }}></p>
                                        </div>
                                    </React.Fragment>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const MenuItem = ({ title, onClick }: MenuItemProps) => (
        <div className="flex items-center justify-between p-4 hover:bg-orange-100 transition-colors cursor-pointer shadow m-2"
            onClick={onClick}>
            <span className="text-gray-700">{title}</span>
            <button className="flex items-center justify-center">
                <img src={arrowRightOrange} alt="Next" className="h-4 w-4" />
            </button>
        </div>
    );

    return (
        <div className="bg-white h-full max-w-screen-md mx-auto">
            <div className="bg-primary px-4 py-3 text-white text-center">
                <h1 className="text-xl font-bold">More Info</h1>
            </div>
            <div className="space-y-1 mt-3">
                <MenuItem title="About Us" onClick={() => handleClick("About Us")} />
                <MenuItem title="FAQs" onClick={() => handleClick("FAQs")} />
                <MenuItem title="Contact" onClick={() => handleClick("Contact")} />
                <MenuItem title="Privacy Policy" onClick={() => handleClick("Privacy Policy")} />
                <MenuItem title="Terms & Conditions" onClick={() => handleClick("Terms & Conditions")} />
            </div>
            {isPopupVisible && <Popup />}
            {isDetailsPopupVisible && <FaqDetailsPopup />}
        </div>
    );
};

export default MoreInfo;

