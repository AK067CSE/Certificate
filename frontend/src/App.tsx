import { SnackbarProvider } from 'notistack'

import Login from './components/Login'
import { Navigate } from 'react-router-dom'

export default function App() {
  // check if role in local storage exists
  const role = localStorage.getItem('role')
  if (role === 'admin') {
    return <Navigate to="/admin" />
  } else if (role === 'trainee') {
    return <Navigate to="/trainee" />
  }

  return (
    <SnackbarProvider maxSnack={3}>
      <Login />
    </SnackbarProvider>
  )
}
