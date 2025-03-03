"use client"

import React from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail, LockKeyhole, User, Phone } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { toast } from "sonner";
import { PhoneInput } from '../ui/phone-input'
import { useMutation } from '@apollo/client'
import { REGISTER_USER } from '@/requests/mutations/user.mutations';
const formSchema = z.object({
    firstname: z.string().min( 3, {
        message: "Firstname should be minimum 3 chars"
    }),
    lastname: z.string().min(3 ,{
        message: "Lastname should be minimum 3 chars"
    }),

    phone: z.string().min(3 ,{
        message: "Lastname should be minimum 3 chars"
    }),

    email: z.string().email({
        message: "Should be a valid email"
    }),
    password: z.string().min(6, {
        message: 'Password must be at least 6 characters'
    }),
    confirmPassword: z.string().min(6, {
        message: 'Password must be at least 6 characters'
    })
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password is not the same as confirm password',
        path: ['confirmPassword'],
      })
    }
  })
const FormRegister: React.FC = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          firstname: "",
          lastname: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: undefined,
        },
    });

    const [register] = useMutation(REGISTER_USER, {
          fetchPolicy: "no-cache"
    });



    function onSubmit(values: z.infer<typeof formSchema>) {

        console.log('values: ', values)
        register({
            variables: {
                infos: {
                    firstName: values.firstname,
                    lastName: values.lastname,
                    email: values.email,
                    password: values.password,
                    phone: values.phone
                }
            },
            onCompleted: (data) => {
                console.log('data onCompleted: ', data)
                toast.success('Registred successfully!', {
                    description: "Create a new account",
                })
            },
            onError: (error) => {
                console.log('error: ', error)
                toast.error(error.message)
            },
        })

    }

    return <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
            <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                    <FormItem
                        className='flex flex-row justify-center items-center'
                    >
                        <div className='w-12'>
                            <User />
                        </div>
                        <FormControl>
                        <Input 
                            type='text'
                            className='flex mt-0'
                            placeholder="Firstname" {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                    <FormItem
                        className='flex flex-row justify-center items-center'
                    >
                        <div className='w-12'>
                            <User />
                        </div>
                        <FormControl>
                        <Input 
                            type='text'
                            className='flex mt-0'
                            placeholder="Lastname" {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem
                        className='flex flex-row justify-center items-center'
                    >
                        <div className='w-12'>
                            <Phone />
                        </div>
                        <FormControl>
                        <PhoneInput 
                            type='text'
                            className='flex mt-0'
                            defaultCountry="FR"
                            placeholder="0681747613" {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem className='flex flex-row items-center'>
                        <div className='w-12'>
                            <Mail />
                        </div>
                        <FormControl>
                            <Input
                                className='flex mt-0'
                                placeholder="email@exemple.com" 
                                {...field} 
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
                    <FormItem
                        className='flex flex-row justify-center items-center'
                    >
                        <div className='w-12'>
                            <LockKeyhole />
                        </div>
                        <FormControl>
                        <Input 
                            type='password'
                            className='flex mt-0'
                            placeholder="password" {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                    <FormItem
                        className='flex flex-row justify-center items-center'
                    >
                        <div className='w-12'>
                            <LockKeyhole />
                        </div>
                        <FormControl>
                        <Input 
                            type='password'
                            className='flex mt-0'
                            placeholder="password" {...field} 
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div
                className="mt-2"
            >
                <Button type="submit" className='flex w-full'>Submit</Button>
            </div>
        </form>
    </Form>
}

export default FormRegister