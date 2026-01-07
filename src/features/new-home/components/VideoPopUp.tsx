import { useEffect } from 'react';
import { useStore } from '@/store';

interface CaptionTrack {
	src: string;
	label: string;
	srclang: string;
	default?: boolean;
}

interface VideoPopUpProps {
	howtouse: boolean;
	onClose: () => void;
	videoLink: string;
	captionTracks?: CaptionTrack[];
}

const VideoPopUp = ({ howtouse, onClose, videoLink, captionTracks }: VideoPopUpProps) => {
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
	const { watchHowToUseApp, setWatchHowToUseApp } = useStore();

	const onClickSkip = () => {
		setWatchHowToUseApp(false);
		localStorage.setItem('IS_SKIPED', 'true');
		onClose();
	};
	const onClickWatchLater = () => {
		setWatchHowToUseApp(true);
		localStorage.setItem('IS_SKIPED', 'false');
		onClose();
	};

	return (
		<div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
			<div className={`bg-white rounded-xl p-8 max-w-2xl relative ${howtouse ? 'border-4 border-primary' : ''}`}>
				<button className="absolute -top-3 -right-3 rounded-full bg-red-500 text-white w-8 h-8" onClick={onClose}>
					X
				</button>
				<div className="w-[80vw] max-w-2xl">
					<video controls className="w-full h-auto" controlsList="nodownload">
						<source src={videoLink} />
						{(captionTracks ?? []).map((t) => (
							<track key={t.srclang + t.label} kind="subtitles" srcLang={t.srclang} src={t.src} label={t.label} default={t.default} />
						))}
					</video>
				</div>
				{howtouse && (
					<div className="flex justify-between mt-4">
						<button onClick={onClickSkip} className="bg-primary text-white px-4 py-2 mr-4 rounded-lg flex-1 mr-2">
							Skip
						</button>
						<button onClick={onClickWatchLater} className="bg-primary text-white px-4 py-2 rounded-lg flex-1 ml-2">
							Watch Later
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default VideoPopUp;


