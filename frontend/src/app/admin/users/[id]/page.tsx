"use client";

import { useEffect } from "react";

import { useRouter, useParams } from "next/navigation";
import { useLazyQuery } from "@apollo/client";
import { GET_USER_BY_ID } from "@/admin/requetes/queries/users.queries";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DetailUser = () => {
  const router = useRouter();
  const { id } = useParams();

  const [getUser, {loading, error, data}] = useLazyQuery(GET_USER_BY_ID, {
    fetchPolicy: "no-cache"
  });

  useEffect(() => {
    console.log('id: ', id)
    if(id) {
      getUser({
        variables: {
          getUserByIdId: id
        },
        onCompleted: (data) => {
          console.log("Success loaded user")
          console.log(data.getUserById)
        }
      })
    }
  }, [id, getUser])

    if(error) return <p>Error, Something wrong...</p>
        

    return (    
     
        <Card
            className="md:w-[500px] md:mx-auto"
        >
            <CardHeader>
                <h1 className="text-2xl text-center">Detail user</h1>
                {loading && (
                    <p>Loading....</p>
                )}
            </CardHeader>
            <CardContent>
                {data && !error && (
                    <div>
                        <p>First Name: {data.getUserById.firstName}</p>
                        <p>Last Name: {data.getUserById.lastName}</p>
                        <p>Email: {data.getUserById.email}</p>
                        <p>Role: {data.getUserById.role}</p>
                        <p>Phone: {data.getUserById.phone}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter
                className="flex gap-2"
            >
                <Button
                    className="w-full"
                    onClick={() => router.push("/admin/users")}
                >Back</Button>
                <Button
                    className="w-full"
                    variant="edit"
                    onClick={() => router.push(`/admin/users/edit/${id}`)}
                >Edit</Button>
                <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => router.push(`/admin/users/${id}/delete`)}
                >Delete</Button>
            </CardFooter>
        </Card>
    

    )
}

export default DetailUser;