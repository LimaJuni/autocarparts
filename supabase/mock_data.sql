-- Clear existing data
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;

DO $$
DECLARE
    cat_brakes UUID;
    cat_engine UUID;
    cat_suspension UUID;
    cat_body UUID;
    cat_electrical UUID;
    cat_transmission UUID;
BEGIN
    -- 1. Insert Categories (Using LoremFlickr with random lock to keep consistent)
    INSERT INTO public.categories (name, image_url) VALUES ('Brake System', 'https://loremflickr.com/400/400/brakes,car?lock=1') RETURNING id INTO cat_brakes;
    INSERT INTO public.categories (name, image_url) VALUES ('Engine Parts', 'https://loremflickr.com/400/400/engine,car?lock=2') RETURNING id INTO cat_engine;
    INSERT INTO public.categories (name, image_url) VALUES ('Suspension', 'https://loremflickr.com/400/400/suspension,car?lock=3') RETURNING id INTO cat_suspension;
    INSERT INTO public.categories (name, image_url) VALUES ('Body Parts', 'https://loremflickr.com/400/400/chassis,car?lock=4') RETURNING id INTO cat_body;
    INSERT INTO public.categories (name, image_url) VALUES ('Electrical', 'https://loremflickr.com/400/400/lights,car?lock=5') RETURNING id INTO cat_electrical;
    INSERT INTO public.categories (name, image_url) VALUES ('Transmission', 'https://loremflickr.com/400/400/gearbox,car?lock=6') RETURNING id INTO cat_transmission;

    -- 2. Insert Products (Brakes)
    INSERT INTO public.products (name, description, price, stock_quantity, category_id, image_url) VALUES
    ('Ceramic Brake Pads', 'High performance ceramic brake pads.', 25000, 50, cat_brakes, 'https://loremflickr.com/400/400/brakepads?lock=10'),
    ('Drilled Slotted Rotors', 'Premium rotors.', 72000, 20, cat_brakes, 'https://loremflickr.com/400/400/brakedisc?lock=11'),
    ('Brake Caliper Assembly', 'Complete caliper assembly.', 51000, 15, cat_brakes, 'https://loremflickr.com/400/400/caliper?lock=12'),
    ('ABS Sensor Front', 'Front wheel speed sensor.', 21000, 40, cat_brakes, 'https://loremflickr.com/400/400/sensor,car?lock=13');

    -- 3. Insert Products (Engine)
    INSERT INTO public.products (name, description, price, stock_quantity, category_id, image_url) VALUES
    ('Oil Filter Premium', 'High filtration efficiency.', 5500, 200, cat_engine, 'https://loremflickr.com/400/400/oilfilter?lock=20'),
    ('Spark Plug Set (4)', 'Iridium spark plugs.', 19500, 60, cat_engine, 'https://loremflickr.com/400/400/sparkplug?lock=21'),
    ('Timing Belt Kit', 'Complete kit with water pump.', 87000, 10, cat_engine, 'https://loremflickr.com/400/400/belt,car?lock=22'),
    ('Alternator 120A', 'High output alternator.', 108000, 8, cat_engine, 'https://loremflickr.com/400/400/alternator?lock=23');

    -- 4. Insert Products (Suspension)
    INSERT INTO public.products (name, description, price, stock_quantity, category_id, image_url) VALUES
    ('Front Strut Assembly', 'Complete strut with coil.', 57000, 12, cat_suspension, 'https://loremflickr.com/400/400/coilspring?lock=30'),
    ('Control Arm Lower', 'With ball joint.', 45000, 15, cat_suspension, 'https://loremflickr.com/400/400/suspension?lock=31');

    -- 5. Insert Products (Body)
    INSERT INTO public.products (name, description, price, stock_quantity, category_id, image_url) VALUES
    ('Side Mirror Assembly', 'Electric heated mirror.', 39000, 20, cat_body, 'https://loremflickr.com/400/400/sidemirror,car?lock=40'),
    ('Front Bumper', 'Primed ready to paint.', 126000, 5, cat_body, 'https://loremflickr.com/400/400/bumper?lock=41');

    -- 6. Insert Products (Electrical)
    INSERT INTO public.products (name, description, price, stock_quantity, category_id, image_url) VALUES
    ('Headlight Assembly', 'LED Headlight.', 90000, 10, cat_electrical, 'https://loremflickr.com/400/400/headlight?lock=50'),
    ('Car Battery 60Ah', 'Maintenance free.', 66000, 15, cat_electrical, 'https://loremflickr.com/400/400/carbattery?lock=51');
    
    -- 7. Insert Products (Transmission)
    INSERT INTO public.products (name, description, price, stock_quantity, category_id, image_url) VALUES
    ('Clutch Kit', 'Pressure plate, disc, bearing.', 114000, 8, cat_transmission, 'https://loremflickr.com/400/400/clutch,car?lock=60'),
    ('CV Axle Shaft', 'Front CV Axle.', 51000, 14, cat_transmission, 'https://loremflickr.com/400/400/axle,car?lock=61');

END $$;
