"use client"

import React from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Mail, LockKeyhole } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { LOGIN } from '@/requests/queries/auth.queries'
import { useLazyQuery } from '@apollo/client'
import { toast } from "sonner";

const formSchema = z.object({
    email: z.string().email({
        message: "Should be a valid email"
    }),
    password: z.string().min(3, {
        message: "Should be minimum 3 chars" 
    })
  })
const FormLogin: React.FC = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          email: "",
          password: "",
        },
    });

    const [login] = useLazyQuery(LOGIN, {
        fetchPolicy: "no-cache"
    })



    function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
        login({
            variables: {
                infos: {
                    email: values.email,
                    password: values.password
                }
            },
            onCompleted(data) {
                console.log('data onCompleted: ', data)
                toast.success('Logged in success', {
                    description: "Friday, February 10, 2023 at 5:57 PM",
                })
            },
            onError(error) {
                console.log('error: ', error)
                toast.error(error.message)
            },
        })
    }

    return <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
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
        <Button type="submit" className='w-full'>Submit</Button>
        </form>
    </Form>
}

export default FormLogin