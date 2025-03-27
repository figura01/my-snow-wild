"use client"

import React, { memo } from "react";
import { GET_USERS } from "@/admin/requetes/queries/users.queries";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation } from "@apollo/client"
import { DELETE_USER_BY_ADMIN } from '@/admin/requetes/mutations/user.mutations'; 
import { useRouter } from "next/navigation";
import {
  CaretSortIcon
} from "@radix-ui/react-icons";
import { Eye, Pen, Trash } from "lucide-react"
import { UserType } from "@/types/user"

import { DataTable } from "@/components/data-table";

const UsersAdminPage = () => {
  const { data, error, loading } = useQuery(GET_USERS, {
    fetchPolicy: "no-cache",
  });

  console.log('data: ', data);

  const [deleteUser] = useMutation(DELETE_USER_BY_ADMIN, {
    fetchPolicy: "network-only",
    refetchQueries: [{ query: GET_USERS }]
  });
  const router = useRouter();
  const handleDeleteUser = (id: string) => {
    console.log('id: ', id)
    deleteUser({
    variables: {
      deleteAdminUserId: id,
    },
    onCompleted:(res) => {
      console.log("SUCCESS TO DELETE")
      console.log("res: ", res)
      
      if(res) {
        console.log('data after result: ', data)
        data.users = data.users.filter((u: UserType) => res.deleteAdminUser.id !== u.id )
        router.push("/admin/users")
      }
    },

    onError: (error) => {
      console.log("ERROR", error)
    },
    
  })
  }


  type User = {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "firstName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
                console.log(column.getIsSorted() === "desc")
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            }
          >
            Firstname
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("firstName")}</div>
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
                console.log(column.getIsSorted() === "desc")
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            }
          >
            Lastname
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("lastName")}</div>
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
                console.log(column.getIsSorted() === "desc")
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            }
          >
            Email
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>
    },
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
                console.log(column.getIsSorted() === "desc")
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            }
          >
            Role
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("role")}</div>
    },
    {
      header: "Action",
      cell: ({ row }) => {
        // console.log('row: ', row)
        // console.log('row.original: ', row.original)
        return (
          <div className="flex lowercase gap-2">
  
           <Link
              href={`/admin/users/${row.original.id}`}
            >
               <div className='
                flex rounded-full bg-gray-200 shadow-sm p-2
                hover:bg-black hover:text-white transition-all'
              >
                <Eye />
              </div>
               
            </Link>
  
            <Link
              className='rounded-full'
              href={`/admin/users/edit/${row.original.id}`}
            >
              <div className='
                flex rounded-full bg-gray-200 shadow-sm p-2
                hover:bg-black hover:text-white transition-all'
              >
                <Pen/>
              </div>
            </Link>
  
            <div
              onClick={() => {
                handleDeleteUser(row.original.id)
              }}
            >             
              <div className='
                flex rounded-full bg-gray-200 shadow-sm p-2
                hover:bg-black hover:text-white transition-all'
              >
                <Trash />
              </div>
            </div>
            {/* <Link href={`/admin/users/${row.original.id}`}>show</Link>
            <Link href={`/admin/users/edit/${row.original.id}`}>Edit</Link> */}
  
          </div>
        )
      }
    }
  ]

  if (loading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Some Error Occurred...</p>;
  }

  return data && (
    <div className="w-full">
      <div className="flex items-cente bg-white">
        {data && (
          <DataTable 
            columns={columns} 
            data={data.users}
            title="List of users"
            createEntity="users"
          />
        )}
      </div>
    </div>
  );
};
           
export default memo(UsersAdminPage);

