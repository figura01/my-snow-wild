import { Input } from "@/components/ui/input";
import { useState } from "react"

const ControlledInput = ({ initialValue, index, form} : {initialValue: number, index: number, form: any}) => {

  const [value, setValue] = useState<number>(initialValue);
  const handleChange = (e: React.FormEvent<HTMLInputElement>) => {

    setValue(Number(e.currentTarget.value))
    // console.log(fields)
    let copyArrSizes = form.getValues('sizes');
    copyArrSizes[index].quantity = Number(e.currentTarget.value);
    form.setValue('sizes', copyArrSizes);
  }

  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => { handleChange(e) }} // handleChange(e)}}
      className="flex items-stretch"
    />
  )
};

export default ControlledInput