import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FormLogin from '../../../components/auth/FormLogin';
const RegisterPage:React.FC = () => {
    return <div className='container flex justify-center py-4'>
        <Card>
            <CardHeader
                className='text-center text-2xl'
            >
                <h1>Login</h1>
            </CardHeader>
            <CardContent>
                <FormLogin />
            </CardContent>
        </Card>
    </div>
}

export default RegisterPage;