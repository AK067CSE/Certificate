from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from algod import (
    create_account,
    create_asset,
    algod_client,
    print_asset_holding,
    print_created_asset,
    opt_in_to_asset,
    transfer_asset_to_trainee,
)
from schemes import *
from openai import OpenAI

SECRET_KEY = "83daa0256a2289b0fb23693bf1f6034d44396675749244721a2b20e896e11662"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin Name",
        "email": "admin@gmail.com",
        "hashed_password": "$2b$12$ZkyYONTiKLgROLwDeo3EjucJeYdrFmN.Vi1XIQxicLWwMpyxccrHS",
        "role": "admin",
        "private_key": "v6CuPLNsK9ruLILGjV0etn5o7OV9XY/3cjCr4IZFS/WbBa/LPs0psQkXIajoyTfHWXX5pVinmhXgnckMEnw3Bg==",
        "public_key": "TMC27SZ6ZUU3CCIXEGUORSJXY5MXL6NFLCTZUFPATXEQYET4G4DJFGBSJM",
    },
    "trainee": {
        "username": "trainee",
        "full_name": "Trainee",
        "email": "trainee@gmail.com",
        "hashed_password": "$2b$12$KbkT1G1UMVkMj0e1neLF2OvM17Z0hg0tz6AC5zrX4duzZ5Ly9LLcq",
        "role": "trainee",
        "private_key": "EczZgLkdkfUBPu36s5CXkbI120VWK5299ErcZ8SCgVFTrcqFR4X2fXeQ+F4ooCHAQw2JCSxZNUGkH6cB4MjxBg==",
        "public_key": "KOW4VBKHQX3H254Q7BPCRIBBYBBQ3CIJFRMTKQNED6TQDYGI6EDN62S7JY",
    },
    "assets": [],
    "opt-in-requests": [],
    "transferred-assets": [],
}

# Initialize OpenAI client
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(db, username: str):
    if username in db:
        user_data = db[username]
        return UserInDB(**user_data)


def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False

    return user


def create_access_token(data: dict, expires_delta: timedelta or None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credential_exception

        token_data = TokenData(username=username)
    except JWTError:
        raise credential_exception

    user = get_user(db, username=token_data.username)
    if user is None:
        raise credential_exception

    return user


async def get_current_admin(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    return current_user


async def get_current_trainee(current_user: UserInDB = Depends(get_current_user)):
    if current_user.role != "trainee":
        raise HTTPException(status_code=403, detail="Forbidden")

    return current_user


@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}


@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_trainee)):
    return current_user


@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(get_current_admin)):
    return [{"item_id": 1, "owner": current_user}]


@app.post("/issue-nft")
async def issue_nft(asset: Asset, current_user: User = Depends(get_current_admin)):
    txid = create_asset(
        unit_name="CERT",
        asset_name=asset.asset_name,
        total=1,
        sender_private_key=db["admin"]["private_key"],
        sender_public_key=db["admin"]["public_key"],
        asset_url=f"https://ipfs.io/ipfs/{asset.asset_url}",
    )

    try:
        # get asset_id from tx
        # Get the new asset's information from the creator account
        ptx = algod_client.pending_transaction_info(txid)
        asset_id = ptx["asset-index"]
        # print_created_asset(algod_client, db["admin"]["public_key"], asset_id)
        # print_asset_holding(algod_client, db["admin"]["public_key"], asset_id)

        # inserting the created asset to db with its name mapping it's id
        db["assets"].append(
            {
                asset.asset_name: {
                    "asset_id": asset_id,
                    "asset_name": asset.asset_name,
                    "asset_image": asset.asset_url,
                }
            }
        )
        return {asset.asset_name: asset_id}
    except Exception as e:
        print(e)


@app.get("/nfts")
async def get_nfts(current_user: User = Depends(get_current_admin)):
    return db["assets"]


@app.post("/opt-in")
async def opt_in(optin: OptIn, current_user: User = Depends(get_current_trainee)):
    asset_id = 0
    for asset in db["assets"]:
        for key, value in asset.items():
            if key == optin.full_name:
                asset_id = value["asset_id"]

    if not asset_id:
        raise HTTPException(status_code=404, detail="Asset not found")

    opt_in_to_asset(
        trainee_public_key=db["trainee"]["public_key"],
        trainee_private_key=db["trainee"]["private_key"],
        asset_id=asset_id,
    )
    db["opt-in-requests"].append({optin.full_name: {"asset_id": asset_id}})
    return {"status": "success"}


@app.get("/opt-in-requests")
async def opt_in_requests():
    return db["opt-in-requests"]


@app.post("/transfer-asset")
async def transfer_asset(
    transfer: AssetTransfer, current_user: User = Depends(get_current_admin)
):
    opt_in_request_exists = False
    for opt_in_request in db["opt-in-requests"]:
        for key, value in opt_in_request.items():
            if key == transfer.full_name:
                opt_in_request_exists = True

    if not opt_in_request_exists:
        raise HTTPException(status_code=404, detail="Asset opt-in request not found")

    transfer_asset_to_trainee(
        admin_public_key=db["admin"]["public_key"],
        admin_private_key=db["admin"]["private_key"],
        trainee_public_key=db["trainee"]["public_key"],
        asset_id=transfer.asset_id,
    )
    asset_image = None
    for asset in db["assets"]:
        for key, value in asset.items():
            if value["asset_id"] == int(transfer.asset_id):
                asset_image = value["asset_image"]

    db["transferred-assets"].append(
        {
            transfer.full_name: {
                "asset_id": transfer.asset_id,
                "asset_image": asset_image,
            }
        }
    )
    # removing from opt-in request
    db["opt-in-requests"].remove(
        {transfer.full_name: {"asset_id": int(transfer.asset_id)}}
    )
    return {"status": "success"}


@app.get("/transferred_assets")
async def transferred_assets():
    return db["transferred-assets"]



