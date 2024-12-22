import base64
import json
from algosdk.v2client import algod
from algosdk import account, mnemonic
from algosdk.transaction import AssetConfigTxn, AssetTransferTxn, AssetFreezeTxn
from algosdk.transaction import *
from algod import *

# Initialize an algod client
algod_address = "http://localhost:4001"
algod_token = "a" * 64
algod_client = algod.AlgodClient(algod_token, algod_address)

accounts = {}
counter = 1
for m in [account.generate_account(), account.generate_account()]:
    accounts[counter] = {}
    accounts[counter]['public_key'] = m[0]  # Assuming m is a tuple (public_key, private_key)
    accounts[counter]['private_key'] = m[1]
    counter += 1

import pprint
pprint.pprint(accounts)

# Check if accounts were created successfully
if not accounts:
    print("No accounts were created.")
else:
    try:
        account_info = algod_client.account_info(accounts[1]['public_key'])
        print(f"Account balance for {accounts[1]['public_key']}: {account_info.get('amount')} microAlgos")
        
        account_info = algod_client.account_info(accounts[2]['public_key'])
        print(f"Account balance for {accounts[2]['public_key']}: {account_info.get('amount')} microAlgos")
    except Exception as e:
        print(f"Error retrieving account info: {e}")

# Get network params for transactions before every transaction.
params = algod_client.suggested_params()

# Account 1 creates an asset called graduation certificate 
txid = create_asset(
    unit_name='CERT',
    asset_name='Grad_Cert_For_Trainee_Abhishek',
    total=1,
    sender_public_key=accounts[1]['public_key'],
    sender_private_key=accounts[1]['private_key'],  # Include the private key
    asset_url='https://tinyurl.com/eddt397j'
)

# Utility function used to print created asset for account and assetid
def print_created_asset(algodclient, account, assetid):    
    account_info = algodclient.account_info(account)
    idx = 0
    for my_account_info in account_info['created-assets']:
        scrutinized_asset = account_info['created-assets'][idx]
        idx += 1       
        if (scrutinized_asset['index'] == assetid):
            print("Asset ID: {}".format(scrutinized_asset['index']))
            print(json.dumps(my_account_info['params'], indent=4))
            break

# Utility function used to print asset holding for account and assetid
def print_asset_holding(algodclient, account, assetid):
    account_info = algodclient.account_info(account)
    idx = 0
    for my_account_info in account_info['assets']:
        scrutinized_asset = account_info['assets'][idx]
        idx += 1        
        if (scrutinized_asset['asset-id'] == assetid):
            print("Asset ID: {}".format(scrutinized_asset['asset-id']))
            print(json.dumps(scrutinized_asset, indent=4))
            break

try:
    ptx = algod_client.pending_transaction_info(txid)
    asset_id = ptx["asset-index"]
    print_created_asset(algod_client, accounts[1]['public_key'], asset_id)
    print_asset_holding(algod_client, accounts[1]['public_key'], asset_id)
except Exception as e:
    print(e)

# OPT-IN
params = algod_client.suggested_params()
account_info = algod_client.account_info(accounts[2]['public_key'])
holding = None
idx = 0
for my_account_info in account_info['assets']:
    scrutinized_asset = account_info['assets'][idx]
    idx += 1    
    if (scrutinized_asset['asset-id'] == asset_id):
        holding = True
        break

if not holding:
    txn = AssetTransferTxn(
        sender=accounts[2]['public_key'],
        sp=params,
        receiver=accounts[2]["public_key"],
        amt=0,
        index=asset_id)
    stxn = txn.sign(accounts[2]['private_key'])
    try:
        txid = algod_client.send_transaction(stxn)
        print("Signed transaction with txID: {}".format(txid))
        confirmed_txn = wait_for_confirmation(algod_client, txid, 4) 
        print("TXID: ", txid)
        print("Result confirmed in round: {}".format(confirmed_txn['confirmed-round']))
    except Exception as err:
        print(err)
    print_asset_holding(algod_client, accounts[2]['public_key'], asset_id)

# Transfer asset of 1 from account 1 to account 2
params = algod_client.suggested_params()
txn = AssetTransferTxn(
    sender=accounts[1]['public_key'],
    sp=params,
    receiver=accounts[2]["public_key"],
    amt=1,
    index=asset_id)
stxn = txn.sign(accounts[1]['private_key'])
try:
    txid = algod_client.send_transaction(stxn)
    print("Signed transaction with txID: {}".format(txid))
    confirmed_txn = wait_for_confirmation(algod_client, txid, 4) 
    print("TXID: ", txid)
    print("Result confirmed in round: {}".format(confirmed_txn['confirmed-round']))
except Exception as err:
    print(err)
print_asset_holding(algod_client, accounts[2]['public_key'], asset_id)
