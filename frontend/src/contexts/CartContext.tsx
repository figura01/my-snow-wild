"use client"

import React, { useContext, useEffect } from 'react';
// import { CartContextType, CartItem } from '@/types/cart';
import { Material } from '@/types/marterial';

export type SizeType = {
  size: string;
  quantity: number;
} 

export interface CartItemType extends Material {
  quantity: number;
  selectedSize: string;
}

interface CartContextType {
  cart: CartItemType[];
  addToCart: (item: Material, selectedSize: string) => void;
  removeFromCart: (id: string, selectedSize: string) => void;
  updateQuantity: (id: string, selectedSize: string, quantity: number) => void;
  getItemCount: () => number;
  increaseQuantity: (cart: CartItemType) => void;
  decreaseQuantity: (cart: CartItemType) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItemType[]>>;
}

export const CartContext = React.createContext<CartContextType | undefined>(undefined);


interface CartProviderProps {
  children: React.ReactNode;
}

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<CartProviderProps> = ({children} : { children: React.ReactNode }) => {
  const [cart, setCart] = React.useState<CartItemType[]>([]);

  useEffect(() => {
    setCart(JSON.parse(sessionStorage.getItem('cart')) || [])
  }, []);

  useEffect(() => {
    sessionStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Material, selectedSize: string) => {
    setCart((prevCart) => {
      console.log('prvCart: ===>', prevCart)
      const existingItem = prevCart?.find(
        (cartItem: CartItemType) =>
          cartItem.id === item.id && cartItem.selectedSize === selectedSize
      );
      if (existingItem && (prevCart !== undefined)) {
        // Si l'article existe avec la même taille, mettre à jour la quantité
        return prevCart.map((cartItem: CartItemType) =>
          cartItem.id === item.id && cartItem.selectedSize === selectedSize
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Ajouter un nouvel article avec la taille sélectionnée
        return [...prevCart, { ...item, quantity: 1, selectedSize }];
      }
    });
  };

  const removeFromCart = (id: string, selectedSize: string) => {
    setCart((prevCart: CartItemType[]) =>
      prevCart.filter(
        (item) => !(item.id === id && item.selectedSize === selectedSize)
      )
    );
  };

  const updateQuantity = (
    id: string,
    selectedSize: string,
    quantity: number
  ) => {
    setCart((prevCart) => {
      console.log('prevCart', prevCart)
      return (
        prevCart.map((item) =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity }
            : item
        )
      )
    });
  };

  const increaseQuantity = (cartItem: CartItemType) => {

    const itemToUpdate = cart.find((element) => element.id === cartItem.id && element.selectedSize === cartItem.selectedSize)

    if(itemToUpdate) {
      itemToUpdate.quantity++;

      setCart((prevCart) => {
        console.log('prevCart', prevCart)
        return (
          prevCart.map((item) =>
            item.id === itemToUpdate.id && item.selectedSize === itemToUpdate.selectedSize
              ? { ...itemToUpdate }
              : item
          )
        )
      });
    }
  }

  const decreaseQuantity = (cartItem: CartItemType) => {
    console.log(cartItem)

    const itemToUpdate = cart.find((element) => element.id === cartItem.id && element.selectedSize === cartItem.selectedSize)

    if(itemToUpdate) {
      itemToUpdate.quantity--;

      setCart((prevCart) => {
        console.log('prevCart', prevCart)
        return (
          prevCart.map((item) =>
            item.id === itemToUpdate.id && item.selectedSize === itemToUpdate.selectedSize
              ? { ...itemToUpdate }
              : item
          )
        )
      });
    }
  }


  // utilisation d'un compteur pour le panier
  const getItemCount = () => {
    return cart?.reduce((total, item) => total + item.quantity, 0);
  };

  return <CartContext.Provider 
    value={{ 
      cart, 
      addToCart, 
      updateQuantity,
      removeFromCart,
      getItemCount,
      increaseQuantity,
      decreaseQuantity,
      setCart
    }}
  >
    {children}
  </CartContext.Provider>;
};