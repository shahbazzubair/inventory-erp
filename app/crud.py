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