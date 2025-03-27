"use client"

import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";

const UnauthorizedPage: React.FC = () => {
    return (
        <div className="h-screen flex flex-col justify-center items-center">
            <h1 className="text-2xl text-center">
                Acces denied
            </h1>
            <p className="text-cenetr mb-6">
                You not authorized to acces of this page
            </p>
            <Button asChild>
                <Link href="/">
                    Return home page
                </Link>
            </Button>
        </div>
    )
}

export default UnauthorizedPage;