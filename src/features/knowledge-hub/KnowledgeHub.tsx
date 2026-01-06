import React, { useState, useEffect } from 'react';
import NoRecordView from './NoRecordView';
import { environment } from './environment';
import Loading from './Loading';

interface KnowledgeHubItem {
    id: number;
    pdf_file: string;
    image: string;
    article_link: string;
    articleCreatedDate: string;
    dateUpload: string;
    article_name: string;
    article_status: string;
}

const KnowledgeHub = () => {
    const [arrKnowledgeHub, setarrKnowledgeHub] = useState<KnowledgeHubItem[]>([]);
    const [isloading, setIsloading] = useState(false);

    const uri = 'https://stage.englishmonkapp.com/englishmonk-staging/backend/web/uploads/lesson/';

    useEffect(() => {
        knowledgeHubApiCall();
    }, []);

    const knowledgeHubApiCall = () => {
        setIsloading(true);
        try {
            var dictParameter = JSON.stringify([{
                "languageID": "1",
                "apiType": "Android",
                "apiVersion": "1.0"
            }]);
            fetch(environment.production == true ? environment.apiBaseUrl + "users/article-details" : "/api/users/article-details", {
                method: 'POST',
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded',
                }),
                body: 'json=' + dictParameter
            })
                .then((response) => response.json())
                .then((responseJson) => {
                    // console.log(JSON.stringify(responseJson));
                    var arrTemp = responseJson[0].data;
                    var arrData: KnowledgeHubItem[] = [];
                    for (var i = 0; i < arrTemp.length; i++) {
                        var dict: KnowledgeHubItem = {
                            id: arrTemp[i].id,
                            pdf_file: arrTemp[i].pdf_file,
                            image: arrTemp[i].image,
                            article_link: arrTemp[i].article_link,
                            articleCreatedDate: arrTemp[i].articleCreatedDate,
                            dateUpload: arrTemp[i].dateUpload,
                            article_name: arrTemp[i].article_name,
                            article_status: arrTemp[i].article_status
                        };
                        arrData.push(dict);
                    }
                    setIsloading(false);
                    setarrKnowledgeHub(arrData);
                });
        } catch (error) {
            setIsloading(false);
            console.error("Error in Fetching home cources " + error);
        }
    };

    const btnSelectAction = (articleLink: string) => {
        window.open(articleLink, '_blank');
    };

    const truncateText = (text: string, maxWords: number) => {
        const words = text.split(' ');
        if (words.length > maxWords) {
            const truncatedText = (
                <>
                    {words.slice(0, maxWords).join(' ')}
                    {' '}
                    <div style={{ color: 'blue' }}>...</div>
                </>
            );
            return truncatedText;
        }
        return text;
    };

    return (
        isloading ? (
            <Loading message={"Processing your request..."} />
        ) : (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                {arrKnowledgeHub.length <= 0 ? (
                    <NoRecordView />
                ) : (
                    <div className="p-10 mt-[-12px]">
                        <div className="flex flex-wrap gap-2">
                            {arrKnowledgeHub.map((item, index) => (
                                <div
                                    key={index}
                                    className="h-full w-80 p-3 bg-background border-1 border-background rounded-lg flex flex-col items-center mt-1 cursor-pointer"
                                    onClick={() => btnSelectAction(item.article_link)}
                                >
                                    {uri + item.pdf_file && (
                                        <div className="flex justify-center items-center rounded-10 border border-background ">
                                            <img
                                                src={uri + item.image}
                                                alt=""
                                                className="rounded-lg border-b border-l border-r border-background rounded-bl-none rounded-br-none"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col border border-background bg-accent w-full rounded-lg rounded-tl-none rounded-tr-none p-3 -mt-2">
                                        <p className="text-lg font-bold overflow-hidden" style={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box' }}>
                                            {truncateText(item.article_name, 14)}
                                        </p>
                                        <div className="text-sm text-right mt-auto">
                                            <p>~ By English Monk</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    );
};

export default KnowledgeHub;

