import { useState } from "react";

const SizeItem = ({ item, selectedSize, setSelectedSize, onHandleSelectSize }) => {
  console.log('selectedSize: ',selectedSize);
  console.log(item)
  const handleSelect = () => {
    // setSelectSize()
    console.log(item)
    
    onHandleSelectSize({
      ...item,
      isActive: !item.isActive
    })
  }
   return item && (
    <div 
      className={`w-100 border-stone-200 border-2 rounded-lg p-2 ${item.label === selectedSize?.label ? 'bg-red-400 border-stone-500' : '' }`} 
      onClick={handleSelect}
    >
      {item.label}
    </div>

  )
}

export default SizeItem;