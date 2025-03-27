import { Input } from "@/components/ui/input";
import { useState } from "react"

export type CounterQuantityType = {
  defaultValue: number;
}

const CounterQuantity: React.FC<CounterQuantityType> = ({ defaultValue } : {defaultValue: number}) => {
  const [countQuantity, setCountQuantity] = useState<number>(defaultValue);
  const increment = () => { setCountQuantity(countQuantity+1)};
  const decrement = () => { setCountQuantity(countQuantity-1)};
  return (
    <div className="flex">
      <Input value={countQuantity} type="number"/>
      <button onClick={() => decrement} className="w-12 h-12 bg-gray-200 rounded-full hover:bg-gray-950 hover: text-white" disabled={countQuantity === 0 ? true : false} >-</button>
      <button onClick={() => increment} className="w-12 h-12 bg-gray-200 rounded-full hover:bg-gray-950 hover: text-white">+</button>
    </div>
  )
}

export default CounterQuantity