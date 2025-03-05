/* eslint-disable @next/next/no-img-element */
"use client"

import { CartItemType, useCart } from "@/contexts/CartContext"
import { Button } from "./ui/button"
import { useState } from "react"

const CartItem:React.FC<CartItemType> = ({ cart } : {cart: CartItemType}) => {
    const { updateQuantity, addToCart, removeFromCart, increaseQuantity, decreaseQuantity } = useCart()
    const [slectedSize, setSelectedSize ] = useState<string | null>(null)
    
    console.log('cartItem comp: ', cart)
    return (
        <div className="relative">
            <h3>{cart.name}</h3>

            <div className="flex w-full items-center border-b pb-1">
                <div
                    className="rounded-md border-md bg-white p-1"
                >
                    <img 
                        src={process.env.NEXT_PUBLIC_IMAGE_URL + cart.picture} 
                        alt={cart.name}
                        className="h-12 w-12"
                    />
                </div>
                <p>
                    size: {cart.selectedSize}
                </p>
                <div>
                    <Button
                        variant={'outline'}
                        className="rounded-full"
                        onClick={() => {
                            increaseQuantity(cart);
                        }}
                    >
                        +
                    </Button>

                    <Button
                        variant={'outline'}
                        className="rounded-full"
                        onClick={() => {
                            decreaseQuantity(cart);
                        }}
                        disabled={cart.quantity === 0}
                    >
                        -
                    </Button>
                    quantity: {cart.quantity}
                </div>

            </div>
           
        </div>
    );
}

export default CartItem