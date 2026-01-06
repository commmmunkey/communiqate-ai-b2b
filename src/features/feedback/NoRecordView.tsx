import React from 'react';
import noDataFoundImage from './no-data-found.png';

const NoRecordView = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen mt-100">
            <img src={noDataFoundImage} alt="No Data Found" className="w-40 h-40" />
            <p className="text-black text-lg mt-10 mb-30 h-70">No Data Found</p>
        </div>
    );
};

export default NoRecordView;

