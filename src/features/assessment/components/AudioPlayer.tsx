import { useRef, useEffect } from 'react';

interface AudioPlayerProps {
    src: string;
    onPlay?: () => void;
    className?: string;
}

const AudioPlayer = ({ src, onPlay, className = '' }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (audioRef.current && src) {
            audioRef.current.load();
        }
    }, [src]);

    const handlePlay = () => {
        if (onPlay) {
            onPlay();
        }
    };

    if (!src) {
        return <div className={className}>No audio available</div>;
    }

    return (
        <div className={className}>
            <audio
                ref={audioRef}
                controls
                className="w-full"
                onPlay={handlePlay}
            >
                <source src={src} type="audio/mpeg" />
                <source src={src} type="audio/webm" />
                Your browser does not support the audio element.
            </audio>
        </div>
    );
};

export default AudioPlayer;


