import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InterviewScreen } from './components/interview/InterviewScreen';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InterviewScreen />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
