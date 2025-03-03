"use client"

import { useEffect, useState, useContext } from "react";
import { useParams } from 'next/navigation'
import { useLazyQuery } from "@apollo/client";

import { GET_MATERIAL_BY_ID } from '@/requests/queries/material.queries';
import { Material, MaterialQuery } from "@/types/marterial";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";

const SingleProductPage: React.FC = () => {
    const { addToCart } = useCart();
    
    const params = useParams();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [getMaterial, { data, loading, error }] = useLazyQuery<MaterialQuery>(GET_MATERIAL_BY_ID, {
        fetchPolicy: "no-cache"
    })

    const [product, setProduct] = useState<Material | null>(null);
    useEffect(() => {
        console.log(params)
        if(params.id) {
            console.log(params);
            getMaterial({
                variables: {
                    findMaterialByIdId: params.id.toString()
                    
                },
                onCompleted(data) {
                    console.log('success data: ', data)
                    setProduct({...data?.findMaterialById})
                },
                onError(error) {
                    console.log('error: ', error.message)
                },
            })
        }
    }, [params, getMaterial])

    const handleAddToCart = () => {
        if(material && selectedSize) {
            const materialWithSize = { ...material, selectedSize };
            addToCart(materialWithSize, selectedSize);
        }
    }

    const material = data?.findMaterialById;

    return  data && (
        <div className="container">
            <h1>Product Page</h1>
            <div className="flex flex-col md:flex-row">
                <div className="flex justify-center w-full md:w-1/2 ">
                    <img 
                        src={`${process.env.NEXT_PUBLIC_IMAGE_URL + product?.picture}`} 
                        alt={product?.name}
                    />
                </div>
                <div className="flex flex-col w-full md:w-1/2">
                    <h2 className="text-3xl">{product?.name}</h2>
                    <h3 className="text-2xl">{product?.price.toFixed(2)}</h3>
                    
                        <h4>Sizes:</h4>
                        
                        <div className="flex flex-row flex-wrap w-full gap-4 mb-2">
                        {product?.sizes?.map(
                            (sizeDetail: { size: string; quantity: number }, index) => {

                                return (
                                    <>
                                        <button key={`${sizeDetail.size + index}`} 
                                            className={`button px-4 py-2 rounded border ${
                                            selectedSize === sizeDetail.size
                                                ? "bg-blue-300 text-white border-blue-300"
                                                : "flex justify-center items-center bg-white text-black border-black"
                                            }`}
                                            onClick={() => setSelectedSize(sizeDetail.size)}
                                            
                                        >
                                            {sizeDetail.size}
                                        </button>
                                    </>
                                )
                            }    
                        )}
                        </div>
                        
                    <p>{product?.description}</p>
                    <Separator />
                    <Button
                        disabled={!selectedSize}
                        onClick={() => {
                            handleAddToCart()
                        }}
                    >
                        Add to card
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default SingleProductPage;