/* eslint-disable @next/next/no-img-element */
"use client"
import { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';
import { Material, Size  } from '@/types/marterial';
import { ICategory } from '@/types/category';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import DefaultImgProduct from '@/assets/default-product.png'
import { Button } from "../ui/button";
import Link from 'next/link';
import { StaticImageData } from 'next/image';


const CardProduct: React.FC<Material> = ({
    id, name, picture, description, category, price, sizes, slectedSize
 } : { 
  name: string,
  picture: string | StaticImageData,
  id: string,
  description: string,
  category: ICategory,
  price: number,
  sizes:Size[],
}) => {

    return (
        <Card>
            <CardHeader>
                <div
                    className="flex h-48 w-full justify-center items-center bg-cover"
                >
                    <img
                        src={picture && process.env && process.env?.NEXT_PUBLIC_IMAGE_URL ? process.env?.NEXT_PUBLIC_IMAGE_URL + picture : DefaultImgProduct} alt="#"
                        width={'auto'}
                        height={100}
                        className="h-48 object-contain"
                    />
                </div>
                <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{price}</p>
            </CardContent>
            <CardFooter>
                
                    <Button
                        asChild
                        variant={'default'}
                        onClick={() => {}}
                        className='flex-1 rounded-none text-xs bg-blue-300 focus:bg-blue-500'
                    >
                        <Link 
                            href={`/products/${id}`}
                        >
                            Show detail
                        </Link>
                    </Button>
                

            </CardFooter>
        </Card>
    )
}

export default CardProduct;