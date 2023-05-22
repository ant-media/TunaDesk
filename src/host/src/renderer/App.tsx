import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import MainComponent from './components/MainComponent';
import './App.css';

export default function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainComponent />} />
      </Routes>
    </Router>
  );
}
