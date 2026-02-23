-- Clear existing invoices to avoid conflicts and start fresh with 5 per customer
DELETE FROM invoices;

-- Function to generate 5 invoices for each customer
DO $$
DECLARE
    cust_record RECORD;
    i INTEGER;
    inv_date DATE;
    due_date DATE;
    total_amt DECIMAL;
    paid_amt DECIMAL;
    inv_status TEXT;
BEGIN
    FOR cust_record IN SELECT id FROM customers LOOP
        FOR i IN 1..5 LOOP
            inv_date := '2025-10-01'::DATE + (cust_record.id * 5 + i) * INTERVAL '1 day';
            due_date := inv_date + INTERVAL '30 days';
            total_amt := FLOOR(RANDOM() * 10000000 + 500000); -- Random integer between 500k and 10.5M
            
            -- Some are paid, some partially, some unpaid
            IF RANDOM() < 0.2 THEN
                paid_amt := total_amt;
                inv_status := 'Paid';
            ELSIF RANDOM() < 0.5 THEN
                paid_amt := FLOOR(total_amt * (RANDOM() * 0.8));
                inv_status := 'Partially Paid';
            ELSE
                paid_amt := 0;
                inv_status := 'Unpaid';
            END IF;

            -- Force fewer items to be overdue relative to '2026-02-21' (15% probability)
            IF RANDOM() < 0.15 THEN
                due_date := '2026-02-01'::DATE - (RANDOM() * 15)::INT * INTERVAL '1 day';
            ELSE
                due_date := '2026-02-21'::DATE + (RANDOM() * 60 + 1)::INT * INTERVAL '1 day';
            END IF;

            INSERT INTO invoices (customer_id, invoice_no, date, due_date, total_amount, paid_amount, status)
            VALUES (
                cust_record.id, 
                'INV-2025-' || LPAD(cust_record.id::TEXT, 2, '0') || '-' || LPAD(i::TEXT, 3, '0'), 
                inv_date, 
                due_date, 
                total_amt, 
                paid_amt, 
                inv_status
            );
        END LOOP;
    END LOOP;
END $$;
