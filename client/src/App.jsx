import { AuthProvider } from './context/AuthContext'
import MainBoardPage from './pages/MainBoardPage'

export default function App() {
  return (
    <AuthProvider>
      <MainBoardPage />
    </AuthProvider>
  )
}
