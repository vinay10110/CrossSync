import Dashboard from "./pages/Dashboard/Dashboard";
import Authentication from './pages/Authentication/Authentication'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
import { Notifications } from "@mantine/notifications";
import '@mantine/notifications/styles.css';
function App() {
 

  return (
    <>
<Notifications />
    <Router>
    <Routes>
      
      <Route path='/' element={<Authentication />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
    </Routes>
    </Router>
 
    </>
  )
}

export default App
