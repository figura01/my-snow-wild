import React, { ButtonHTMLAttributes, useState } from "react"

interface ISizeLabel {
  label: string,
  isActive: boolean,
  onHandleClickSize: (field: any, size: string) => void,
  field: any,
  // children: any
}

const SizeLabel:React.FC<ISizeLabel> = ({ label, isActive, onHandleClickSize, field}) => {

  const [status, setStatus] = useState<Boolean>(isActive || false);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    setStatus(!status)
    onHandleClickSize(field, label)
  }

  return <button
    className={
      `hover:border-black border-2 rounded-lg w-14 flex px-3 py-2 text-center items-center justify-center text-sm 
        ${status ? 'bg-black text-white' : 'bg-gray-200 text-black'}`
      }
    onClick={(e) => { handleClick(e) }}
  >
    {label}
  </button>
}

export default SizeLabel;