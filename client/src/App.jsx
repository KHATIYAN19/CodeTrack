import { useState } from 'react'
import { Route,Routes ,Navigate} from 'react-router-dom'
import AddQuestionForm from './Component/AddQuestionForm'
import AddTopicForm from './Component/AddTopicForm'
import QuestionListPage from './Component/QuestionListPage'
import TopicListPage from './Component/TopicListPage'
import TopicQuestionsPage from './Component/TopicQuestionPage'
import Navbar from './Component/Navbar'
import './App.css'
function App() {
  return (
    <div className=' w-[90%] mx-auto max-h-max'>
      <Navbar></Navbar>
       <div>
       
       </div>
       <Routes>
         <Route path="add-question" element={<AddQuestionForm/>}/>
          <Route path="/add-topic" element={<AddTopicForm/>}/>
         <Route path="/problems" element={<QuestionListPage/>}/>


         <Route path="/topics" element={<TopicListPage />} />

     <Route path="/topics/:topicName" element={<TopicQuestionsPage />} />


     <Route path="/" element={<Navigate replace to="/topics" />} />
        {/* <Route path="/upcoming" element={<Upcoming/>}/>
         <Route path="/upload" element={<Upload/>}/>
         <Route path="/getall" element={<Details/>}/> */}
       </Routes>     
       </div>
  )
}
export default App
