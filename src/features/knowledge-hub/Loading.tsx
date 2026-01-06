import React from 'react';

interface LoadingProps {
    message: string;
}

const Loading = ({ message }: LoadingProps) => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className='flex flex-col justify-center items-center '>
                <div className="w-16 h-16 border-4 border-t-transparent border-[#F3812F] rounded-full animate-spin mb-4"></div>
                <div className="text-sm text-gray-600 mt-2">{message}</div>
            </div>
        </div>
    );
};

export default Loading;

