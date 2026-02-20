from pydantic import BaseModel
from typing import Optional
from datetime import datetime 


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


# --- SUPPLIER SCHEMAS ---
class SupplierBase(BaseModel):
    name: str
    email: str
    phone: str | None = None
    address: str | None = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    class Config:
        from_attributes = True

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: str | None = None
    address: str | None = None

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    class Config:
        from_attributes = True




# --- TRANSACTION SCHEMAS ---
class TransactionBase(BaseModel):
    product_id: int
    transaction_type: str  # "IN" or "OUT"
    quantity: int
    supplier_id: int | None = None
    customer_id: int | None = None

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True