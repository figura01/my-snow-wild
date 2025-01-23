"use client" 

// import { useContext } from "react";
// import { CartContext } from "@/contexts/CartContext";
import CardProduct from "@/components/card-product"

const Products  =() => {

    return (
        <div className="container h-full pt-10">
            <h1 className="pt-10">Product Page</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ">
                <CardProduct />

            </div>
        </div>
    )
}

export default Products