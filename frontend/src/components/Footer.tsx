"use client"
import React from 'react';

const Footer: React.FC = () => {
    return <footer
        className="w-full bg-gray-50 py-4"
    >
        <div className="container flex flex-wrap justift-start">
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/4">
            <h3>Catgories</h3>
                Col 1
            </div>
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/4">
                <h3>Our policy</h3>
                Col 2
            </div>
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/4">
                <h3>Get in touch</h3>
                Col 4
            </div>
            <div className="flex flex-col w-full sm:w-1/2 md:w-1/4">
                <h3>Follow us</h3>
                Col 3
            </div>
        </div>
    </footer>
}

export default Footer;