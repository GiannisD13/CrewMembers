import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />}     />
        <Route path="/browse"   element={<Browse />}   />
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}
