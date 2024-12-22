from typing import Optional
from fastapi import FastAPI

from algosdk import account, encoding, mnemonic
from algosdk.transaction import *
from algosdk.error import WrongChecksumError, WrongMnemonicLengthError
from algosdk.v2client import algod, indexer

from schemes import *
import json

algod_client = algod.AlgodClient(
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "http://localhost:4001",
)  # Initializing the algod client
indexer_client = indexer.IndexerClient(
    "", "http://localhost:8980"
)  # initializing the validator


def create_account():  # Create a function that creates an account
    private_key, address = account.generate_account()
    passphrase = mnemonic.from_private_key(private_key)

    return {"public_key": address, "private_key": private_key, "mnemonic": passphrase}


def create_asset(
    unit_name, asset_name, sender_public_key, sender_private_key, asset_url, total
):
    # Get network params for transactions before every transaction.
    params = algod_client.suggested_params()

    # creating an asset transaction
    asset_txn = AssetConfigTxn(
        sender=sender_public_key,
        sp=params,
        total=total,
        default_frozen=False,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=sender_public_key,
        freeze=sender_public_key,
        clawback=sender_public_key,
        reserve=sender_public_key,
        url=asset_url,
        decimals=0,
    )
    stxn = asset_txn.sign(sender_private_key)
    # Send the transaction to the network and retrieve the txid.
    try:
        txid = algod_client.send_transaction(stxn)
        print("Signed transaction with txID: {}".format(txid))
        # Wait for the transaction to be confirmed
        confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
        print("TXID: ", txid)
        print("Result confirmed in round: {}".format(confirmed_txn["confirmed-round"]))
        return txid
    except Exception as err:
        print(err)
    # Retrieve the asset ID of the newly created asset by first
    # ensuring that the creation transaction was confirmed,
    # then grabbing the asset id from the transaction.


#   Utility function used to print created asset for account and assetid
def print_created_asset(algodclient, account, assetid):
    # note: if you have an indexer instance available it is easier to just use this
    # response = myindexer.accounts(asset_id = assetid)
    # then use 'account_info['created-assets'][0] to get info on the created asset
    account_info = algodclient.account_info(account)
    idx = 0
    for my_account_info in account_info["created-assets"]:
        scrutinized_asset = account_info["created-assets"][idx]
        idx = idx + 1
        if scrutinized_asset["index"] == assetid:
            print("Asset ID: {}".format(scrutinized_asset["index"]))
            print(json.dumps(my_account_info["params"], indent=4))
            break


#   Utility function used to print asset holding for account and assetid
def print_asset_holding(algodclient, account, assetid):
    # note: if you have an indexer instance available it is easier to just use this
    # response = myindexer.accounts(asset_id = assetid)
    # then loop thru the accounts returned and match the account you are looking for
    account_info = algodclient.account_info(account)
    idx = 0
    for my_account_info in account_info["assets"]:
        scrutinized_asset = account_info["assets"][idx]
        idx = idx + 1
        if scrutinized_asset["asset-id"] == assetid:
            print("Asset ID: {}".format(scrutinized_asset["asset-id"]))
            print(json.dumps(scrutinized_asset, indent=4))
            break


# OPT-IN
def opt_in_to_asset(trainee_public_key, trainee_private_key, asset_id):
    # Check if asset_id is in trainee's asset holdings prior
    # to opt-in
    params = algod_client.suggested_params()
    # comment these two lines if you want to use suggested params
    # params.fee = 1000
    # params.flat_fee = True

    account_info = algod_client.account_info(trainee_public_key)
    holding = None
    idx = 0
    for my_account_info in account_info["assets"]:
        scrutinized_asset = account_info["assets"][idx]
        idx = idx + 1
        if scrutinized_asset["asset-id"] == asset_id:
            holding = True
            break

    if not holding:
        # Use the AssetTransferTxn class to transfer assets and opt-in
        txn = AssetTransferTxn(
            sender=trainee_public_key,
            sp=params,
            receiver=trainee_public_key,
            amt=0,
            index=asset_id,
        )
        stxn = txn.sign(trainee_private_key)
        # Send the transaction to the network and retrieve the txid.
        try:
            txid = algod_client.send_transaction(stxn)
            print("Signed transaction with txID: {}".format(txid))
            # Wait for the transaction to be confirmed
            confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
            print("TXID: ", txid)
            print(
                "Result confirmed in round: {}".format(confirmed_txn["confirmed-round"])
            )

        except Exception as err:
            print(err)
        # Now check the asset holding for that account.
        # This should now show a holding with a balance of 0.
        print_asset_holding(algod_client, trainee_public_key, asset_id)


def transfer_asset_to_trainee(
    admin_public_key, admin_private_key, trainee_public_key, asset_id
):
    # transfer asset of from admin to trainee
    params = algod_client.suggested_params()
    # comment these two lines if you want to use suggested params
    # params.fee = 1000
    # params.flat_fee = True
    txn = AssetTransferTxn(
        sender=admin_public_key,
        sp=params,
        receiver=trainee_public_key,
        amt=1,
        index=asset_id,
    )
    stxn = txn.sign(admin_private_key)
    # Send the transaction to the network and retrieve the txid.
    try:
        txid = algod_client.send_transaction(stxn)
        print("Signed transaction with txID: {}".format(txid))
        # Wait for the transaction to be confirmed
        confirmed_txn = wait_for_confirmation(algod_client, txid, 4)
        print("TXID: ", txid)
        print("Result confirmed in round: {}".format(confirmed_txn["confirmed-round"]))

    except Exception as err:
        print(err)
    # The balance should now be 1.
    print_asset_holding(algod_client, trainee_public_key, asset_id)
