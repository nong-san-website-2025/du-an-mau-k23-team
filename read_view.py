import sys  
with open('backend/payments/views.py', 'r', encoding='utf-8') as f:  
    lines = f.readlines()  
    for i in range(126, 152):  
        print(f\"{i+1}: {lines[i]}\", end='')  
