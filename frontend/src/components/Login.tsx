import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
export default function Component() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault()
    const formData = new FormData()
    // Append key-value pairs to the FormData object
    formData.append('username', username)
    formData.append('password', password)
    try {
      const response = await axios.post('http://localhost:8000/token', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type to form data
        },
      })
      if (response && response.data) {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('role', response.data.role)
        if (response.data.role == 'admin') {
          navigate('/admin')
        } else {
          navigate('/trainee')
        }
      }
      // Handle response data here
    } catch (error) {
      console.error(error)
      // Handle error here
    }
  }

  return (
    <div className="flex flex-col justify-between h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <header className="flex flex-col items-center justify-center pt-20 space-y-4">
        <h1 className="text-4xl font-bold text-white">Login</h1>
        <h2 className="text-xl text-gray-200">Welcome back!</h2>
      </header>
      <main className="flex flex-col items-center justify-center space-y-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <Label className="text-white" htmlFor="username">
              Username
            </Label>
            <Input id="username" placeholder="Enter your username" required type="text" onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-white" htmlFor="password">
              Password
            </Label>
            <Input id="password" placeholder="Enter your password" required type="password" onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <Button
          type="submit"
          className="flex items-center justify-center w-full max-w-md space-x-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500"
          onClick={(e) => handleSubmit(e)}
        >
          <LockIcon className="w-5 h-5 text-white" />
          <span>Connect</span>
        </Button>
      </main>
      <footer className="flex items-center justify-center py-4 bg-gray-100 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Powered by Algorand</p>
      </footer>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
