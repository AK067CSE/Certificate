import base64
import json
from algosdk.v2client import algod
from algosdk import account, mnemonic
from algosdk.transaction import AssetConfigTxn, AssetTransferTxn, AssetFreezeTxn
from algosdk.transaction import *

# Initialize an algod client
algod_address = "http://localhost:4001"
algod_token = "a" * 64
algod_client = algod.AlgodClient(algod_token, algod_address)

# Generate accounts
accounts = {}
counter = 1
for m in [account.generate_account(), account.generate_account()]:
    accounts[counter] = {}
    accounts[counter]['public_key'] = m[0]  # Assuming m is a tuple (public_key, private_key)
    accounts[counter]['private_key'] = m[1]
    counter += 1

import pprint
pprint.pprint(accounts)

