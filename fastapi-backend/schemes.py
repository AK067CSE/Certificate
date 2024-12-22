from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str


class TokenData(BaseModel):
    username: str or None = None


class User(BaseModel):
    username: str
    email: str or None = None
    full_name: str or None = None
    role: str = "trainee"


class UserInDB(User):
    hashed_password: str


class Asset(BaseModel):
    asset_name: str
    asset_url: str


class OptIn(BaseModel):
    full_name: str


class AssetTransfer(BaseModel):
    asset_id: str
    full_name: str
