"use client"
import { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import DefaultImgProduct from '@/assets/default-product.png'
import Image from "next/image";
import { Button } from "../ui/button";

type TCardProduct = {
    id: string;
    name: string;
    price: number;
    category: string;
    imgUrl: string;
}

const CardProduct: React.FC<TCardProduct> = () => {
    const cartCtx = useContext(CartContext);
    const { addToCart, carts} = cartCtx;
    console.log('conetxt: ', cartCtx)
    return (
        <Card>
            <CardHeader>
                <Image 
                    src={DefaultImgProduct} alt=""

                />
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Card Content</p>
            </CardContent>
            <CardFooter>
                <Button 
                    variant={'default'}
                    onClick={() => {}}
                >
                    Add to cart
                </Button>
            </CardFooter>
        </Card>
    )
}

export default CardProduct;