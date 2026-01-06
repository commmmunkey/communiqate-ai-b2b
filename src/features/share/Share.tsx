import React, { useEffect } from 'react';
import {
    EmailIcon,
    EmailShareButton,
    FacebookIcon,
    FacebookShareButton,
    LinkedinIcon,
    LinkedinShareButton,
    RedditIcon,
    RedditShareButton,
    TelegramIcon,
    TelegramShareButton,
    TwitterIcon,
    TwitterShareButton,
    WhatsappIcon,
    WhatsappShareButton,
} from "react-share";
import shareAppIllustration from './share_app_illustration.png';

const Share = () => {
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
        <div className='flex flex-col justify-center items-center p-10'>
            <img src={shareAppIllustration} alt="share page Icon" className="w-40 h-40 mr-2" />
            <div className='text-primary text-lg font-bold'>Invite your friends</div>
            <div>Share the app with your friends and learn together!</div>
            <div className='mt-20'>
                <div>Share</div>
            </div>
            <div className='mt-5 flex justify-center items-center'>
                <div className="flex space-x-4">
                    <WhatsappShareButton url={'https://www.englishmonkapp.com/'}>
                        <WhatsappIcon className="rounded-full" size={32} />
                    </WhatsappShareButton>
                    <FacebookShareButton url={'https://www.englishmonkapp.com/'}>
                        <FacebookIcon className="rounded-full" size={32} />
                    </FacebookShareButton>
                    <RedditShareButton url={'https://www.englishmonkapp.com/'}>
                        <RedditIcon className="rounded-full" size={32} />
                    </RedditShareButton>
                    <TwitterShareButton url={'https://www.englishmonkapp.com/'}>
                        <TwitterIcon className="rounded-full" size={32} />
                    </TwitterShareButton>
                    <EmailShareButton url={'https://www.englishmonkapp.com/'}>
                        <EmailIcon className="rounded-full" size={32} />
                    </EmailShareButton>
                    <TelegramShareButton url={'https://www.englishmonkapp.com/'}>
                        <TelegramIcon className="rounded-full" size={32} />
                    </TelegramShareButton>
                    <LinkedinShareButton url={'https://www.englishmonkapp.com/'}>
                        <LinkedinIcon className="rounded-full" size={32} />
                    </LinkedinShareButton>
                </div>
            </div>
        </div>
    );
};

export default Share;

