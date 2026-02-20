from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from datetime import datetime, timezone
from .database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    stock = Column(Integer, default=0)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)



class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    address = Column(String)

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    address = Column(String)



class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    transaction_type = Column(String)  # We will use "IN" (Purchase) or "OUT" (Sale)
    quantity = Column(Integer)
    
    # If it's an "IN" transaction, we record the supplier. 
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    # If it's an "OUT" transaction, we record the customer.
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc))