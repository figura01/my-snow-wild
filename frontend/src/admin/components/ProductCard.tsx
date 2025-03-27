"use client"

import { buttonVariants, Button } from "@/components/ui/button"
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";
import { DELETE_MATERIAL_ADMIN } from '@/requetes/mutations/material.mutations';
import { useMutation } from '@apollo/client';

type ProductType = {
  category : {
    id: string, 
    name: string,
  };
  description: string;
  name: string;
  picture: string;
  price: 49;
  quantity: number;
  id: string;
  sizes: [{
    size: string,
    quantity: number;
  }]
}

const ProductCard = ({ product }: {product: ProductType}) => {
  const {name, category, description, picture, price, quantity, id, sizes} = product;
  const [deleteMaterial, { data, loading, error }] = useMutation(DELETE_MATERIAL_ADMIN);
  const { toast } = useToast()
  const router = useRouter();
  console.log('material id: ', id)
  const handleDelete = () => {
    // console.log('id mat:', id, typeof id)
    deleteMaterial({
      variables: {
        deleteMaterialId: id
      },
      onCompleted: ((data) => {
        console.log('successfully deleted')
        console.log(data)
        toast({
          title: "Delete",
          description: "Product successfully delete",
        });
        router.push("/admin/products")
      }),
      onError:((error) => {
        console.log('Error when try to deleted')
        console.log(error)
      }),
      fetchPolicy: "no-cache",
    })
  }
  return <Card className="py-8">
    <CardContent>
      <div className="flex gap-4">
        <div className="flex justify-center w-1/3">
          <img src={picture} width="100"/>
        </div>
        
       
        <div className="flex flex-col gap-4 w-2/3">
          
          <h1 className="text-4xl">{name}</h1>
          <p className="text-3xl"><strong>Price: </strong>{price}</p>
          <p>{description}</p>
          <p><strong>Category: </strong>{category.name}</p>
          
          <div className="flex flex-col">
            <strong>Quantity per size </strong>{quantity}
            <div className="flex gap-4">
            {sizes.map((s: {size: string, quantity: number}) => 
              <div
                key={`size_${s.size}`}
                className="flex flex-col"
              >
                <div className="w-10 rounded text-center bg-black text-white">{s.size}</div>
                <p className="text-center">{s.quantity}</p>
              </div>
            )}
            </div>
          </div>
          <CardFooter className="flex w-full p-0 gap-4">
          
            <Button asChild>
              <Link href={`/admin/products/edit/${id}`} className={`buttonVariants({ variant: "outline" }) w-[150px]`}>
                  Edit
              </Link>
            </Button>
            <Button className="w-[150px]" variant="destructive" onClick={handleDelete}>Delete</Button>
          </CardFooter>
        
        </div>
      
      </div>
      
      
    </CardContent>
  </Card>
}

export default ProductCard