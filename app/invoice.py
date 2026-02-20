import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def generate_invoice(transaction_id: int, transaction_type: str, quantity: int, date: str, product_name: str, product_price: float, party_name: str):
    os.makedirs("invoices", exist_ok=True)
    
    #  Name the PDF file automatically
    file_path = f"invoices/receipt_{transaction_id}.pdf"
    
    #  Create the blank PDF document
    c = canvas.Canvas(file_path, pagesize=letter)
    
    # Draw the Header
    title = "SALES INVOICE" if transaction_type == "OUT" else "PURCHASE ORDER"
    c.setFont("Helvetica-Bold", 20)
    c.drawString(200, 750, title)
    
    # Draw the Business Details
    c.setFont("Helvetica", 12)
    c.drawString(50, 700, "Inventory ERP-Lite")
    c.drawString(50, 680, f"Date: {date}")
    c.drawString(50, 660, f"Transaction ID: #{transaction_id}")
    
    #  Draw the Customer/Supplier Details
    party_label = "Billed To (Customer):" if transaction_type == "OUT" else "Ordered From (Supplier):"
    c.drawString(50, 620, party_label)
    c.drawString(50, 600, party_name)
    
    # Draw the Item Details
    c.drawString(50, 550, "-" * 80) 
    c.drawString(50, 530, f"Item: {product_name}")
    c.drawString(50, 510, f"Quantity: {quantity}")
    c.drawString(50, 490, f"Unit Price: ${product_price}")
    
    #  Calculate and draw the total
    total = quantity * product_price
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 450, f"TOTAL: ${total:.2f}")
    
    #  Save and close the PDF
    c.save()
    
    return file_path