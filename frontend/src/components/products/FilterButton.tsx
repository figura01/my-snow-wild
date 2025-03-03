import { Button } from "../ui/button";
// import { ICategory } from "@/types/category";

const FilterButton = ({ categoryName, selectedCategory, onHandleCategoryClick } : { 
    categoryName: string, 
    selectedCategory: string,
    onHandleCategoryClick: (category: string) => void;
}) => {
    return (
        <Button
            variant={selectedCategory === categoryName ? 'default' : 'outline' }
            onClick={() => {
                onHandleCategoryClick(categoryName)
            }} 
            className="py-1 px-1 rounded-full sm:py-2 sm:px-4"
        >
            <span className="text-xs capitalize sm:text-sm ">{categoryName}</span>
        </Button>
    )
}

export default FilterButton;