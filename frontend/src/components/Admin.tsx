/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { FormEvent, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CardTitle, CardDescription, CardHeader, CardContent, Card } from '@/components/ui/card'
import { Navigate } from 'react-router-dom'
import { AvatarImage, AvatarFallback, Avatar } from '@/components/ui/avatar'
import { useNavigate } from 'react-router-dom'
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useState } from 'react'
import axios from 'axios'

function Admin() {
  // check if role in local storage exists and is admin
  const role = localStorage.getItem('role')
  if (role !== 'admin') {
    return <Navigate to="/" />
  }

  const [isLoading, setIsLoading] = useState(false)
  const [optinRequests, setOptinRequests] = useState([])
  const [transferredAssets, setTransferredAssets] = useState([])
  const navigate = useNavigate()
  const handleLogout = () => {
    localStorage.clear()
    window.location.reload()
  }
  const getOptinRequests = async () => {
    const response = await axios.get('http://localhost:8000/opt-in-requests')
    setOptinRequests(response.data)
  }
  const getTransferredAssets = async () => {
    const response = await axios.get('http://localhost:8000/transferred_assets')
    setTransferredAssets(response.data)
  }

  const handleOptinApproval = async (e: FormEvent<HTMLButtonElement>, fullName: string, assetId: string) => {
    e.preventDefault()
    setIsLoading(true)
    const response = await axios.post(
      'http://localhost:8000/transfer-asset',
      { full_name: fullName, asset_id: assetId.toString() },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      },
    )
    setIsLoading(false)
    getOptinRequests()
    getTransferredAssets()
  }

  useEffect(() => {
    getOptinRequests()
    getTransferredAssets()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <header className="flex items-center justify-between px-6 py-4 text-white bg-gray-800">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <div>
          <Button className="mr-6 text-white bg-green-400 hover:bg-green-700" onClick={() => navigate('/admin/issue-nft')}>
            Issue An NFT
          </Button>
          <Button className="text-white bg-red-500 hover:bg-red-600" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white rounded-lg shadow-md dark:bg-gray-800">
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-semibold">Opt-in Requests</CardTitle>
              <CardDescription>A list of trainee's opt-in requests for NFT certificates.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {optinRequests.map((optinRequest: any) => (
                  <div key={Object.keys(optinRequest)[0]} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage alt="@shadcn" src="/placeholder-avatar.jpg" />
                        <AvatarFallback>AB</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <h4 className="font-semibold">{Object.keys(optinRequest)[0]}</h4>
                        <p className="text-gray-500 dark:text-gray-400">
                          Asset-id {optinRequest[Object.keys(optinRequest)[0]]['asset_id']}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Button
                        className="text-sm"
                        variant="outline"
                        onClick={(e) =>
                          handleOptinApproval(e, Object.keys(optinRequest)[0], optinRequest[Object.keys(optinRequest)[0]]['asset_id'])
                        }
                      >
                        {isLoading ? 'Loading...' : 'Approve'}
                      </Button>
                      <Button className="ml-4 text-sm text-white bg-red-600" variant="outline" onClick={(e) => {}}>
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-lg shadow-md dark:bg-gray-800">
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-semibold">NFT Certificates</CardTitle>
              <CardDescription>A list of transferred NFT certificates.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {transferredAssets.map((transferredAsset: any) => (
                  <div key={Object.keys(transferredAsset)[0]} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage alt="@shadcn" src="/placeholder-avatar.jpg" />
                        <AvatarFallback>AB</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <h4 className="font-semibold">{Object.keys(transferredAsset)[0]}</h4>
                        <p className="text-gray-500 dark:text-gray-400">
                          Asset-id {transferredAsset[Object.keys(transferredAsset)[0]]['asset_id']}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Admin
