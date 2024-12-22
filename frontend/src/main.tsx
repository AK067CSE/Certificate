import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.css'
import ErrorBoundary from './components/ErrorBoundary'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Admin from './components/Admin'
import Trainee from './components/Trainee'
import IssueNft from './components/IssueNft'
import ErrorPage from './components/Error'
import Optin from './components/Optin'
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
  },

  {
    path: 'admin',
    element: <Admin />,
  },
  {
    path: 'trainee',
    element: <Trainee />,
  },
  {
    path: 'trainee/opt-in',
    element: <Optin />,
  },
  {
    path: 'admin/issue-nft',
    element: <IssueNft />,
  },
])
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    {/* <ErrorBoundary>
      <App />
    </ErrorBoundary> */}
  </React.StrictMode>,
)
