/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import * as algokit from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { CalculatorClient } from '../contracts/client'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const AppCalls = (props: {
  //method: Methods
  //setAuctionState: React.Dispatch<React.SetStateAction<AuctionState>>
  appID: number
  setAppID?: React.Dispatch<React.SetStateAction<number>>
}) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [value, setValue] = useState<number>(0)
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sender = { signer, addr: activeAddress! }

  const appClient = new CalculatorClient(
    {
      resolveBy: 'id',
      id: props.appID,
      sender,
    },
    algodClient,
  )
  //console.log('calling contract', appClient)

  const Create = async () => {
    if (props.setAppID === undefined) throw Error('setAppID is undefined')

    setLoading(true)

    await appClient.create.bare().catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    })

    const { appId } = await appClient.appClient.getAppReference()
    setLoading(false)
    console.log('igotit', appId)

    props.setAppID(Number(appId))
  }

  const Read = async () => {
    setLoading(true)
    const suggestedParams = await algodClient.getTransactionParams().do()
    const atc = new algosdk.AtomicTransactionComposer()
    atc.addMethodCall({
      method: appClient.appClient.getABIMethod('read_result')!,
      // methodArgs: [{ txn: bidPayment, signer }],
      sender: sender.addr,
      signer,
      appID: props.appID,
      suggestedParams,
    })

    try {
      const result = await atc.execute(algodClient, 3)
      console.log('read_response', result)
      console.log('response', result.methodResults[0].returnValue)
      const res = Number(result.methodResults[0].returnValue) // Convert BigInt to number
      console.log(res) // Output: 10
      setValue(res)
    } catch (e) {
      console.warn(e)
      enqueueSnackbar(`Error deploying the contract: ${(e as Error).message}`, { variant: 'error' })
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const Add = async (a: number, b: number) => {
    setLoading(true)
    // const appAddress = algosdk.getApplicationAddress(props.appID);
    const suggestedParams = await algodClient.getTransactionParams().do()
    const atc = new algosdk.AtomicTransactionComposer()

    atc.addMethodCall({
      method: appClient.appClient.getABIMethod('add')!,
      methodArgs: [a, b],
      suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
      sender: sender.addr,
      signer,
      appID: props.appID,
    })

    try {
      const result = await atc.execute(algodClient, 3)
      //Use the returnValue as needed in your React app
      console.log('response', result.methodResults[0].returnValue)
      const res = Number(result.methodResults[0].returnValue) // Convert BigInt to number
      console.log(res) // Output: 10
      setValue(res)
    } catch (e) {
      console.warn('since', e)
      enqueueSnackbar(`Error calling the function: ${(e as Error).message}`, { variant: 'error' })
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const Minus = async (a: number, b: number) => {
    setLoading(true)
    // const appAddress = algosdk.getApplicationAddress(props.appID);
    const suggestedParams = await algodClient.getTransactionParams().do()
    const atc = new algosdk.AtomicTransactionComposer()

    atc.addMethodCall({
      method: appClient.appClient.getABIMethod('minus')!,
      methodArgs: [a, b],
      suggestedParams: { ...suggestedParams, fee: 2_000, flatFee: true },
      sender: sender.addr,
      signer,
      appID: props.appID,
    })

    try {
      const result = await atc.execute(algodClient, 3)
      //Use the returnValue as needed in your React app
      console.log('response', result.methodResults[0].returnValue)
      const res = Number(result.methodResults[0].returnValue) // Convert BigInt to number
      console.log(res) // Output: 10
      setValue(res)
    } catch (e) {
      console.warn('since', e)
      enqueueSnackbar(`Error calling the function: ${(e as Error).message}`, { variant: 'error' })
      setLoading(false)
      return
    }

    setLoading(false)
  }

  return (
    <div className="flex justify-center gap-32 mx-auto my-10">
      <div className="flex flex-col justify-start gap-10">
        <button className="btn" onClick={Create}>
          create App
        </button>
        <button className="btn" onClick={() => Add(5, 5)}>
          Add
        </button>
        <button className="btn" onClick={() => Minus(45, 15)}>
          Minus
        </button>
        <button className="btn" onClick={Read}>
          Read
        </button>
      </div>

      <div className="bg-blue-400 w-96">
        <p className="p-2">Display</p>
        <p className="my-10 text-5xl text-center">{value}</p>
      </div>
    </div>
  )
}

export default AppCalls
