from sqlalchemy.orm import Session
from . import models, schemas, auth

def create_product(db:Session, product=schemas.ProductCreate):
    db_product= models.Product(
        name=product.name,
        sku=product.sku,
        description=product.description,
        price=product.price,
        stock=product.stock
    )

    db.add(db_product)

    db.commit()

    db.refresh(db_product)

    return db_product

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


def get_product(db:Session, product_id:int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def update_product(db: Session, product_id: int, product: schemas.ProductCreate):
    db_product = get_product(db, product_id)
    
    if db_product:
        db_product.name = product.name
        db_product.sku = product.sku
        db_product.description = product.description
        db_product.price = product.price
        db_product.stock = product.stock
        
        db.commit()
        db.refresh(db_product)
        
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    
    if db_product:
        db.delete(db_product)
        db.commit()
        
    return db_product



def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# --- SUPPLIER OPERATIONS ---
def create_supplier(db: Session, supplier: schemas.SupplierCreate):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def get_suppliers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Supplier).offset(skip).limit(limit).all()

# --- CUSTOMER OPERATIONS ---
def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()




def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_product = db.query(models.Product).filter(models.Product.id == transaction.product_id).first()
    
    if not db_product:
        raise ValueError("Product not found")

    if transaction.transaction_type == "IN":
        db_product.stock += transaction.quantity
        
        transaction.customer_id = None 
        
    elif transaction.transaction_type == "OUT":
        if db_product.stock < transaction.quantity:
            raise ValueError(f"Not enough stock! You only have {db_product.stock} left.")
        
        db_product.stock -= transaction.quantity
        
        transaction.supplier_id = None
        
    else:
        raise ValueError("Transaction type must be 'IN' or 'OUT'")

    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).offset(skip).limit(limit).all()