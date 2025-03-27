"use client"

import { useRouter } from "next/navigation";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form, 
  FormControl, 
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRoleEnum } from "@/types/user";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { GET_USER_BY_ID } from "@/admin/requetes/queries/users.queries";
import { UPDATE_USER_BY_ADMIN } from "@/admin/requetes/mutations/user.mutations";
import { PhoneInput } from "@/components/ui/phone-input";
import { useParams } from "next/navigation";


const phoneValidation = new RegExp(/(?:([+]\d{1,4})[-.\s]?)?(?:[(](\d{1,3})[)][-.\s]?)?(\d{1,4})[-.\s]?(\d{1,4})[-.\s]?(\d{1,9})/g);

const AdminEditUser = () => {
  const { id } = useParams();
  const router = useRouter();
  const [updateUser] = useMutation(UPDATE_USER_BY_ADMIN, {
    fetchPolicy: "no-cache"
  })
  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: "First name must be at least 2 characters.",
    }),
    lastName: z.string().min(2, {
      message: "Last name must be at least 2 characters.",
    }),
    email: z.string().email({message: "Email is not valid"}),
    role: z.string().min(1, {
      message: "A role must be selected."
    }),
    password: z
      .string()
      .min(1, { message: 'Must have at least 1 character' }),
      // .regex(passwordValidation, {
      //   message: 'Your password is not valid',
      // }),
    phone: z
    .string().min(1, {message: "Phone number can't be empty"})
    .regex(phoneValidation, {message: 'Your phone number is invalid'})
    // .or(z.literal("")),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: undefined,
      password: "",
    },
  })

  const [getUser] = useLazyQuery(GET_USER_BY_ID);

  useEffect(() => {
    if(id && form) {
      getUser({
        variables: {
          getUserByIdId: id
        },
        onCompleted: (data) => {
          console.log("Success loaded user")
          console.log(data.getUserById)
          form.setValue("firstName", data?.getUserById.firstName);
          form.setValue("lastName", data.getUserById.lastName);
          form.setValue("email", data.getUserById.email)
          form.setValue("role", data?.getUserById?.role);
          form.setValue("phone", data.getUserById.phone)
          
        },
        onError: (error) => {
          console.log("error: ", error)
        }
      })
    }
  },[id, getUser, form])
  

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    updateUser({
      variables: {
        infos: {
          ...values
        },
        updateUserId: id
      },
      onCompleted:(data) => {
        console.log("succes")
        console.log(data)
        toast("Success", {
          description: "Successfully updated user",
        })
        router.push("/admin/users");
      },
      onError: (err) => {
        console.log("error")
        console.log(err.message)
        toast("Error, something wrong...", {
          description: err.message,
        })
      }
    })
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="md:w-[500px] md:mx-auto">
            <CardHeader
              className="text-2xl text-center"
            >
              Edit user
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem
                    className="mb-3"
                  >
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem
                    className="mb-3"
                  >
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Snow" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem
                    className="mb-3"
                  >
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email" 
                        placeholder="John-Snow@gmail.com" {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem
                    className="mb-3"
                  >
                    <FormLabel>Role</FormLabel>
                  
                    <Select 
                      onValueChange={(value) => { 
                        field.onChange(value)
                      }}
                    >
                      <FormControl> 
                        <SelectTrigger>
                          <SelectValue placeholder={form.getValues("role")} />
                        </SelectTrigger>
                      
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {
                            (Object.keys(UserRoleEnum) as Array<keyof typeof UserRoleEnum>).map((key) => {
                              return (
                                <SelectItem
                                  key={`role_${key}`}
                                  value={UserRoleEnum[key]}
                                >
                                  {key}
                                </SelectItem>
                              )
                            })
                          }
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    
                    <FormMessage />
                  </FormItem>
                )}
                
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start mb-3">
                    <FormLabel className="text-left">Phone Number</FormLabel>
                    <FormControl className="w-full">
                      <PhoneInput 
                        placeholder="Enter a phone number" {...field}
                        defaultCountry="FR"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start mb-3">
                    <FormLabel className="text-left">Password</FormLabel>
                    <FormControl className="w-full">
                      <Input 
                        type="password"
                        placeholder="Enter a password" {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            </CardContent>
            <CardFooter
                className="flex gap-2"
            >
              <Button
                className="w-full"
                onClick={() => router.push("/admin/users")}
              >
                Back
              </Button>
              <Button 
                type="submit"
                className="w-full">
                Submit
              </Button>
            </CardFooter>
          </Card>
        </form>
    </Form>
  )
}

export default AdminEditUser;