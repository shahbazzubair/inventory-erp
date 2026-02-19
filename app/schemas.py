from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name:str
    sku:str
    description:Optional[str] = None
    price:float
    stock:int = 0

class ProductResponse(BaseModel):
    id:int
    name:str
    sku:str
    description: Optional[str] = None
    price:float
    stock:int

class Config:
    from_attributes=True



class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool

    class Config:
        from_attributes = True