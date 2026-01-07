interface LoadingProps {
    message?: string;
}

const Loading = ({ message = "Loading..." }: LoadingProps) => {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className='flex flex-col justify-center items-center '>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-sm text-gray-600 mt-2">{message}</div>
            </div>
        </div>
    );
};

export default Loading;

