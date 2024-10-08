import Layout from "../components/Common/Layout"
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';

import Header from './components/Header';
import HomeMain from './pages/homepages/HomeMain';

function App() {


  return (
    <Router>
      <Routes>
        <Route path ="/" element={<HomeMain />}></Route>
      </Routes>
    </Router>
    
  )
}

export default App;
