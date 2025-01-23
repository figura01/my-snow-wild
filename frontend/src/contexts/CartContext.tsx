"use client"

import React from 'react';
import { CartContextType, ICart } from '@/types/carte';

export const CartContext = React.createContext<CartContextType | null>(null);

const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [carts, setCarts] = React.useState<ICart[]>([
    {
        id: "ec048eb3-cfa4-432d-8a17-69fd5b0fd12f",
        name: "Liberty",
        description: "La Liberty, avec son flex confortable et son profil Flat Out Rocker est idéale pour les sorties tout-terrain : tolérante et sans accrochage, son comportement est prévisible.",
        price: 49.5,
        imgUrl: "/uploads/liberty.jpg",
        sizes: [
            {"size":"110","quantity":20},
            {"size":"115","quantity":20},
            {"size":"120","quantity":50},
        ]
    },
    {
      id: "fabefcb9-4d0b-4231-abe1-d7355ca5f6e6",
      name: "Redster",
      description: "La Liberty, avec son flex confortable et son profil Flat Out Rocker est idéale pour les sorties tout-terrain : tolérante et sans accrochage, son comportement est prévisible.",
      price: 49.5,
      imgUrl: "/uploads/redster.jpg",
      sizes: [
          {"size":"110","quantity":20},
          {"size":"115","quantity":20},
          {"size":"120","quantity":50},
      ]
    },
  ]);

  const addToCart = (cart: ICart) => {
    setCarts([...carts, cart]);
  };

  const updateCart = (id: string, cartToUpdate: ICart) => {
    carts.filter((cart: ICart) => {
      if (cart.id === id) {
        cart = { ...cartToUpdate }
        setCarts([...carts]);
      }
    });
  };
  return <CartContext.Provider value={{ carts, addToCart, updateCart }}>{children}</CartContext.Provider>;
};

export default CartProvider;