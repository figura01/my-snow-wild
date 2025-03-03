import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import FormRegister from '@/components/auth/FormRegister'

const RegisterPage:React.FC = () => {
    return <div className='container flex justify-center py-4'>
    <Card>
        <CardHeader
            className='text-center text-2xl py-2'
        >
            <h1>Register</h1>
        </CardHeader>
        <CardContent>
            <FormRegister />
        </CardContent>
    </Card>
</div>
}

export default RegisterPage;