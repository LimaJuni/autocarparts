import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    totalAmount: number;
}

const CartContext = createContext<CartContextType>({
    items: [],
    addToCart: () => { },
    removeFromCart: () => { },
    clearCart: () => { },
    totalAmount: 0,
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (product: any) => {
        setItems((currentItems) => {
            const existing = currentItems.find((item) => item.id === product.id);
            if (existing) {
                return currentItems.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...currentItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems((currentItems) => currentItems.filter((item) => item.id !== productId));
    };

    const clearCart = () => setItems([]);

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalAmount }}>
            {children}
        </CartContext.Provider>
    );
};
