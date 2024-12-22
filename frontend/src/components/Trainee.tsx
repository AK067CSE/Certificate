/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { AvatarImage, AvatarFallback, Avatar } from '@/components/ui/avatar'
import { CardTitle, CardHeader, CardContent, Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Trainee() {
  // check if role in local storage exists and is admin
  const role = localStorage.getItem('role')
  if (role !== 'trainee') {
    return <Navigate to="/" />
  }
  const [transferredAssets, setTransferredAssets] = useState([])

  const getTransferredAssets = async () => {
    const response = await axios.get('http://localhost:8000/transferred_assets')
    setTransferredAssets(response.data)
  }

  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.clear()
    window.location.reload()
  }

  useEffect(() => {
    getTransferredAssets()
  }, [])
  return (
    <div className="w-full min-h-screen p-10 text-white bg-gradient-to-r from-green-400 to-blue-500">
      <nav className="flex items-center justify-between w-full mb-10">
        <div>
          <h1 className="text-4xl font-bold">Welcome Trainee</h1>
          <p className="text-lg">You can view your certificate status here</p>
        </div>
        <div>
          <Button onClick={() => navigate('/trainee/opt-in')} className="mr-8 text-white bg-green-700 hover:bg-red-600">
            Optin
          </Button>
          <Button onClick={handleLogout} className="text-white bg-red-500 hover:bg-red-600">
            Logout
          </Button>
        </div>
      </nav>
      <main>
        <Card className="p-6 rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Your Certificate Status</CardTitle>
          </CardHeader>
          {transferredAssets.length == 0 && <p className="text-lg ml-7">You have no certificate issued yet</p>}
          {transferredAssets.map((transferredAsset: any) => (
            <CardContent key={Object.keys(transferredAsset)[0]}>
              <div className="flex items-center space-x-4">
                <BadgeIcon className="w-12 h-12 text-green-500" />
                <div className="text-lg">NFT Certificate Request</div>
              </div>
              <div className="grid gap-2 mt-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">Status:</Label>
                  <Badge className="text-base" variant="default">
                    Approved
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-base">Asset ID:</Label>
                  <span className="text-base"> {transferredAsset[Object.keys(transferredAsset)[0]]['asset_id']}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Label className="text-base">Image:</Label>
                  <span className="text-base">{`https://ipfs.io/ipfs/${transferredAsset[Object.keys(transferredAsset)[0]]['asset_image']}`}</span>
                  <img
                    alt="NFT image"
                    height={50}
                    src={`https://ipfs.io/ipfs/${transferredAsset[Object.keys(transferredAsset)[0]]['asset_image']}`}
                    style={{
                      aspectRatio: '50/50',
                      objectFit: 'cover',
                    }}
                    width={50}
                  />
                </div>
              </div>
            </CardContent>
          ))}
        </Card>
      </main>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BadgeIcon(props: any) {
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
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    </svg>
  )
}
