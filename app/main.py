from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse 
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from . import crud, models, schemas, auth, invoice 
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



# --- SECURITY DEPENDENCY ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user




@app.post("/products/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) 
):
    return crud.create_product(db=db, product=product)

@app.get("/products/", response_model=list[schemas.ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_products(db, skip=skip, limit=limit)

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int, 
    product: schemas.ProductCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # <-- THE LOCK
):
    db_product = crud.update_product(db, product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # <-- THE LOCK
):
    db_product = crud.delete_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}





@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    return crud.create_user(db=db, user=user)

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = auth.create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}


# --- PHASE 3: CUSTOMERS & SUPPLIERS ROUTES ---

@app.post("/suppliers/", response_model=schemas.SupplierResponse)
def create_supplier(
    supplier: schemas.SupplierCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Locked!
):
    return crud.create_supplier(db=db, supplier=supplier)

@app.get("/suppliers/", response_model=list[schemas.SupplierResponse])
def read_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_suppliers(db, skip=skip, limit=limit)


@app.post("/customers/", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Locked!
):
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers/", response_model=list[schemas.CustomerResponse])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_customers(db, skip=skip, limit=limit)




@app.post("/transactions/", response_model=schemas.TransactionResponse)
def create_transaction(
    transaction: schemas.TransactionCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) 
):
    try:
        return crud.create_transaction(db=db, transaction=transaction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/transactions/", response_model=list[schemas.TransactionResponse])
def read_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_transactions(db, skip=skip, limit=limit)




@app.get("/transactions/{transaction_id}/invoice", response_class=FileResponse)
def download_invoice(
    transaction_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Locked!
):
    #  Find the transaction
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    #  Find the product details
    db_product = db.query(models.Product).filter(models.Product.id == db_transaction.product_id).first()
    
    #  Find the Customer or Supplier details
    party_name = "Unknown"
    if db_transaction.transaction_type == "IN" and db_transaction.supplier_id:
        supplier = db.query(models.Supplier).filter(models.Supplier.id == db_transaction.supplier_id).first()
        party_name = supplier.name if supplier else "Unknown Supplier"
    elif db_transaction.transaction_type == "OUT" and db_transaction.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == db_transaction.customer_id).first()
        party_name = customer.name if customer else "Unknown Customer"

    #  Generate the PDF
    pdf_path = invoice.generate_invoice(
        transaction_id=db_transaction.id,
        transaction_type=db_transaction.transaction_type,
        quantity=db_transaction.quantity,
        date=db_transaction.date.strftime("%Y-%m-%d %H:%M:%S"),
        product_name=db_product.name,
        product_price=db_product.price, # Assuming your product model has a 'price' field!
        party_name=party_name
    )
    
    #  Send the PDF file to the user to download!
    return FileResponse(path=pdf_path, filename=f"Invoice_{transaction_id}.pdf", media_type='application/pdf')