/* eslint-disable @typescript-eslint/no-explicit-any */
import { CardTitle, CardHeader, CardContent, Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Link, Navigate } from 'react-router-dom'
import { FormEvent, SVGProps, useEffect, useState } from 'react'
import { JSX } from 'react/jsx-runtime'
import axios from 'axios'

export default function IssueNft() {
  // check if role in local storage exists and is admin
  const role = localStorage.getItem('role')
  if (role !== 'admin') {
    return <Navigate to="/" />
  }

  const [asset_name, setAssetName] = useState<string>('')
  const [asset_url, setAssetUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [nfts, setNfts] = useState([])
  const handleIssueNft = async (e: FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const response = await axios.post(
      'http://localhost:8000/issue-nft',
      { asset_name: asset_name, asset_url: asset_url },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      },
    )
    setIsLoading(false)
    getNfts()
  }

  const getNfts = async () => {
    const response = await axios.get('http://localhost:8000/nfts', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    })
    setNfts(response.data)
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.reload()
  }
  useEffect(() => {
    getNfts()
  }, [])
  return (
    <div className="flex flex-col h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <header className="flex items-center justify-between px-6 py-4 text-white bg-gray-800">
        <Link to="/" className="text-lg font-semibold">
          Admin Dashboard
        </Link>

        <Button className="text-white bg-red-500 hover:bg-red-600" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-4 overflow-y-auto">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Issue NFT</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <Input id="nft-name" placeholder="NFT Name (Username)" required onChange={(e) => setAssetName(e.target.value)} />
                <Input id="nft-url" placeholder="Pinata image hash" required onChange={(e) => setAssetUrl(e.target.value)} />

                <Button type="submit" onClick={handleIssueNft}>
                  {isLoading ? 'Loading...' : 'Issue NFT'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>NFT Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th>Id</th>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Total Supply</th>
                  </tr>
                </thead>
                <tbody>
                  {nfts.map((nft: any) => (
                    <tr key={nft[Object.keys(nft)[0]].asset_id}>
                      <td>{nft[Object.keys(nft)[0]].asset_id}</td>
                      <td>{nft[Object.keys(nft)[0]].asset_name}</td>
                      <td>
                        <img
                          alt="NFT image"
                          height={50}
                          src={`https://ipfs.io/ipfs/${nft[Object.keys(nft)[0]].asset_image}`}
                          style={{
                            aspectRatio: '50/50',
                            objectFit: 'cover',
                          }}
                          width={50}
                        />
                      </td>
                      <td>1</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
