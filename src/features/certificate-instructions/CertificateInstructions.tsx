import React, { useEffect } from 'react';
import logoAboutUs from './logo_about_us.png';

const CertificateInstructions = () => {
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

    return (
        <div className="flex flex-col items-center">
            <img src={logoAboutUs} alt="Header" className="mx-auto w-48 h-auto" />
            <div className="max-w-lg px-4 py-8">
                <div className="text-lg font-bold mb-3">Instructions for Earning Your Certificate of Completion</div>
                <div>Congratulations on your commitment to improving your English skills with our Premium subscription plan! To earn your Certificate of Completion, here's what you need to know:</div>
                <div className="text-lg font-bold mt-3">1. Passing Criteria:</div>
                <div>You must score 70% or higher in at least 2 out of the 3 full-length exams included in your Premium plan</div>
                <div className="text-lg font-bold mt-3">2. Number of Attempts:</div>
                <div>You have a total of 5 attempts for each of the 3 full-length exams during the duration of your Premium subscription plan</div>
                <div className="text-lg font-bold mt-3">3. Premium Subscription Duration:</div>
                <div>Your Premium subscription plan is valid for 60 days from the date of purchase</div>
                <div className="text-lg font-bold mt-3">4. How to Attempt Exams:</div>
                <div>Access the exams by navigating to the designated exam section within your Premium account. You can take each exam as many times as needed within your 5 attempts per exam</div>
                <div className="text-lg font-bold mt-3">5. Achieving Your Certificate:</div>
                <div>Once you score 70% or higher in at least 2 out of the 3 exams, you will automatically qualify for a Certificate of Completion</div>
                <div className="text-lg font-bold mt-3">6. Sharing Your Certificate:</div>
                <div>You can proudly share your Certificate of Completion with prospective employers, managers, or anyone interested in your language proficiency. Use this certificate to boost your career opportunities and showcase your dedication to improving your English skills.</div>
                <div className="text-lg font-bold mt-3">7. Need Assistance:</div>
                <div>If you have any questions or require assistance while preparing for the exams, please don't hesitate to contact our support team at <a href="mailto:examsupport@englishmonkapp.com" className="text-primary">examsupport@englishmonkapp.com</a></div>
                <div className="flex justify-center items-center">
                    <div className="text-lg font-bold text-center">Best of Luck!</div>
                </div>
                <div>We wish you the best of luck on your journey to English proficiency! Your hard work and dedication will open doors to exciting career opportunities.</div>
                <div className="mt-3">Thank you for choosing our Premium subscription plan. We're excited to be part of your language learning journey, and we look forward to celebrating your success with your Certificate of Completion!</div>
            </div>
        </div>
    );
};

export default CertificateInstructions;

