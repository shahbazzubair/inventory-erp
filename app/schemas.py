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