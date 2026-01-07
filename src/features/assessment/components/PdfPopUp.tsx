import { useEffect } from 'react';
import { environment } from '../environment';

interface PdfPopUpProps {
    onClose: () => void;
    pdfUrl: string;
    onStartAnswering?: () => void;
}

const PdfPopUp = ({ onClose, pdfUrl, onStartAnswering }: PdfPopUpProps) => {
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
    
    const proxyUrl = environment.production === true ? pdfUrl : `/pdf/${pdfUrl.split('/').pop()}`;

    return (
        <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-50 z-50 m-1">
            <div className="bg-white rounded-xl p-4 w-full h-full max-w-4xl max-h-screen relative flex flex-col">
                <button className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center" onClick={onClose}>X</button>
                <div className="flex-grow overflow-auto">
                    <object data={proxyUrl + "#toolbar=0"} type="application/pdf" className="w-full h-full">
                        <p>Alternative text - include a link <a href={proxyUrl}>to the PDF!</a></p>
                    </object>
                </div>
                {onStartAnswering != null && <button
                    className="hover:bg-[#f5914a] bg-primary text-white font-bold  py-2 px-4 rounded mt-4 self-center"
                    onClick={onStartAnswering}
                >
                    Start Answering
                </button>}
            </div>
        </div>
    );
};

export default PdfPopUp;

