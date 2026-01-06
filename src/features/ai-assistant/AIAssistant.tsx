import React from 'react'
import AvatarControl from './AvatarControl'
import { useStore } from '@/store'

const AIAssistant = () => {
  // const userId = localStorage.getItem('USER_ID')
  // const tokenId = localStorage.getItem('TOKEN_ID')
  const assistantId = useStore(state => state.aiassistantName)

  // console.log("Token id " + tokenId + " userId is " + userId + " assistantName " + assistantId);

  return (
    <div className="h-screen flex flex-col">
      <div className="h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white flex flex-col justify-center items-center">
        {/* {(assistantId === "/email-assistant" || assistantId === "/cv-cover-letter-assistant") ? */}
        {/* <iframe
                    className="w-full h-full"
                    src={`https://stage.englishmonkapp.com/AIAssistant/?userId=${userId}&tokenId=${tokenId}&assistantName=${assistantId}`}
                    title="AiAssistant"
                /> */}
        {/* : */}
        <AvatarControl assistantName={assistantId} />
        {/* } */}
      </div>
    </div>
  )
}

export default AIAssistant