const express = require('express');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// In-memory data storage
let menu = [];
let orders = [];

// Valid categories for menu items
const validCategories = ['Starter', 'Main Course', 'Dessert', 'Beverage'];

// Utility function to generate a unique ID
const generateId = (arr) => arr.length ? Math.max(...arr.map(item => item.id)) + 1 : 1;

// Add or update a menu item
app.post('/menu', (req, res) => {
    const { id, name, price, category } = req.body;
    
    // Validate menu item
    if (!name || price <= 0 || !validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid menu item details.' });
    }

    // If id is provided, update the item, otherwise add a new item
    if (id) {
        const itemIndex = menu.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            menu[itemIndex] = { id, name, price, category };
            return res.status(200).json({ message: 'Menu item updated successfully.' });
        } else {
            return res.status(404).json({ error: 'Menu item not found.' });
        }
    } else {
        const newItem = { id: generateId(menu), name, price, category };
        menu.push(newItem);
        return res.status(201).json({ message: 'Menu item added successfully.', item: newItem });
    }
});

// Get all menu items
app.get('/menu', (req, res) => {
    res.status(200).json(menu);
});

// Place an order
app.post('/orders', (req, res) => {
    const { items } = req.body;
    
    // Validate order items
    const invalidItems = items.filter(itemId => !menu.find(menuItem => menuItem.id === itemId));
    if (invalidItems.length > 0) {
        return res.status(400).json({ error: `Invalid item IDs: ${invalidItems.join(', ')}` });
    }

    // Create a new order
    const order = {
        id: generateId(orders),
        items,
        status: 'Preparing',
        timestamp: new Date()
    };
    orders.push(order);
    res.status(201).json({ message: 'Order placed successfully.', order });
});

// Get details of a specific order
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        return res.status(200).json(order);
    } else {
        return res.status(404).json({ error: 'Order not found.' });
    }
});

// Automate status updates every minute (cron job)
cron.schedule('* * * * *', () => {
    orders.forEach(order => {
        if (order.status === 'Preparing') {
            order.status = 'Out for Delivery';
        } else if (order.status === 'Out for Delivery') {
            order.status = 'Delivered';
        }
    });
    console.log('Order statuses updated:', orders);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
