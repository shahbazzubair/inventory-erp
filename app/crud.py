from sqlalchemy.orm import Session
from . import models, schemas

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